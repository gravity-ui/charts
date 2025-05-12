import {dateTime} from '@gravity-ui/date-utils';

import {formatNumber} from '../../libs';
import type {FormatNumberOptions} from '../../types/formatter';

export function getFormattedDataLabel(args: {
    value: string | number | undefined | null;
    dateFormat?: string;
    numberFormat?: FormatNumberOptions;
}) {
    const {value, numberFormat, dateFormat} = args;

    const valueAsNumber = Number(value);

    if (dateFormat) {
        const date = dateTime({input: value});
        if (date?.isValid()) {
            return date.format(dateFormat);
        }
    }

    if (!Number.isNaN(valueAsNumber) && numberFormat) {
        return formatNumber(valueAsNumber, numberFormat);
    }

    return String(value);
}
