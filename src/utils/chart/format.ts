import {dateTime} from '@gravity-ui/date-utils';
import type {DateTimeInput} from '@gravity-ui/date-utils';
import type {AxisDomain} from 'd3';
import capitalize from 'lodash/capitalize';

import type {PreparedAxis} from '../../hooks';
import {formatNumber, getDefaultUnit} from '../../libs';
import type {FormatOptions} from '../../libs/format-number/types';
import type {ValueFormat} from '../../types';

import {getDefaultDateFormat} from './time';

const LETTER_MOUNTH_AT_START_FORMAT_REGEXP = /^M{3,}/;

function getFormattedDate(args: {value: DateTimeInput; format?: string}) {
    const {value, format = ''} = args;
    const date = dateTime({input: value});

    if (date?.isValid()) {
        const formattedDate = date.format(format);

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
            return formatNumber(Number(value), format);
        }
        case 'date': {
            return getFormattedDate({value, format: format.format});
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
            const format = axis.labels.dateFormat || getDefaultDateFormat(step);

            return getFormattedDate({value: date, format});
        }
        case 'linear':
        default: {
            const numberFormat: FormatOptions = {
                unit: value && step ? getDefaultUnit(step) : undefined,
                ...axis.labels.numberFormat,
            };

            return formatNumber(value as number | string, numberFormat);
        }
    }
}
