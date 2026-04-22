import {dateTimeUtc} from '@gravity-ui/date-utils';
import type {DateTimeInput} from '@gravity-ui/date-utils';
import type {AxisDomain} from 'd3-axis';
import capitalize from 'lodash/capitalize';

import {formatNumber, getDefaultUnit} from '../../libs';
import type {FormatOptions} from '../../libs/format-number/types';
import type {ValueFormat} from '../../types';
import type {PreparedAxis} from '../axes/types';
import {DEFAULT_DATE_FORMAT} from '../constants';

import {
    DATETIME_LABEL_FORMATS,
    TIME_UNITS,
    getDefaultDateFormat,
    getDefaultTimeOnlyFormat,
} from './time';

const LETTER_MOUNTH_AT_START_FORMAT_REGEXP = /^M{3,}/;

/**
 * Expands the custom `B` token before passing the format string to `date.format()`.
 *
 * - `B` — half-year (*B*i-annual) digit: expands to `1` or `2`.
 *   `H` and `h` are already reserved by Day.js (24 h and 12 h clock hours respectively),
 *   so `B` (from Latin *bi*, "twice a year") is used as the token for half-year.
 *   No major date library defines a native half-year token, so this is a custom convention.
 *   Use Day.js escape syntax for the label prefix, e.g. `'YYYY [H]B'` → `"2024 H1"`.
 *   Mirrors the quarter pattern: `'YYYY [Q]Q'` → `"2024 Q2"`.
 *
 * Tokens inside `[…]` Day.js escape blocks are passed through unchanged.
 */
function processCustomDateTokens(
    format: string,
    date: NonNullable<ReturnType<typeof dateTimeUtc>>,
): string {
    let result = '';
    let i = 0;
    while (i < format.length) {
        if (format[i] === '[') {
            const end = format.indexOf(']', i + 1);
            if (end === -1) {
                result += format[i++];
            } else {
                result += format.slice(i, end + 1);
                i = end + 1;
            }
        } else if (format[i] === 'B') {
            result += date.month() < 6 ? '1' : '2';
            i++;
        } else {
            result += format[i++];
        }
    }
    return result;
}

function getFormattedDate(args: {value: DateTimeInput; format?: string}) {
    const {value, format = DEFAULT_DATE_FORMAT} = args;
    const date = dateTimeUtc({input: value});

    if (date?.isValid()) {
        const processedFormat = processCustomDateTokens(format, date);
        const formattedDate = date.format(processedFormat);

        if (LETTER_MOUNTH_AT_START_FORMAT_REGEXP.test(format)) {
            return capitalize(formattedDate);
        }

        return formattedDate;
    }

    return String(value);
}

export function getFormattedValue(args: {
    value: string | number | undefined | null;
    format?: ValueFormat;
}) {
    const {value, format} = args;

    switch (format?.type) {
        case 'number': {
            if (typeof value === 'number') {
                return formatNumber(Number(value), format);
            }
            break;
        }
        case 'date': {
            return getFormattedDate({value, format: format.format});
        }
        case 'custom': {
            return format.formatter?.({value});
        }
    }

    return String(value);
}

export function formatAxisTickLabel(args: {axis: PreparedAxis; value: AxisDomain; step?: number}) {
    const {axis, value, step} = args;

    switch (axis.type) {
        case 'category': {
            return value as string;
        }
        case 'datetime': {
            const date = value as number;

            let format: string;

            if (axis.labels.dateFormat) {
                format = axis.labels.dateFormat;
            } else if (step !== undefined && step < TIME_UNITS.day) {
                const d = dateTimeUtc({input: date});
                const isMidnight =
                    d.isValid() &&
                    d.hour() === 0 &&
                    d.minute() === 0 &&
                    d.second() === 0 &&
                    d.millisecond() === 0;
                format = isMidnight ? DATETIME_LABEL_FORMATS.day : getDefaultTimeOnlyFormat(step);
            } else {
                format = getDefaultDateFormat(step, axis.labels.dateTimeLabelFormats);
            }

            return getFormattedDate({value: date, format});
        }
        case 'linear':
        default: {
            const numberFormat: FormatOptions = {
                unit: value && step ? getDefaultUnit(step) : undefined,
                ...axis.labels.numberFormat,
            };

            return formatNumber(value as number, numberFormat);
        }
    }
}
