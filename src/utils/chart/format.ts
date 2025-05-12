import {dateTime} from '@gravity-ui/date-utils';

import {formatNumber} from '../../libs';
import type {ValueFormat} from '../../types';

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
            const date = dateTime({input: value});
            if (date?.isValid()) {
                return date.format(format.format);
            }
        }
    }

    return String(value);
}
