import type {AreaRangeSeriesData, ValueFormat} from '../../../types';
import {getFormattedValue} from '../../utils/format';

export function formatAreaRange(args: {y0: number; y1: number; format?: ValueFormat}) {
    const {y0, y1, format} = args;
    const formattedY0 = getFormattedValue({value: y0, format});
    const formattedY1 = getFormattedValue({value: y1, format});

    return `${formattedY0} – ${formattedY1}`;
}

export function formatAreaRangeDataLabel(args: {data: AreaRangeSeriesData; format?: ValueFormat}) {
    const {data, format} = args;

    if (data.label !== undefined) {
        return getFormattedValue({value: data.label, format});
    }

    if (data.y0 === null || data.y1 === null) {
        return '';
    }

    return formatAreaRange({y0: data.y0, y1: data.y1, format});
}
