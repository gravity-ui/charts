import type {PieArcDatum} from 'd3-shape';

import type {PieSeriesData, ValueFormat} from '../../../types';
import {getFormattedValue} from '../../utils/format';

import type {SegmentData} from './types';

const FULL_CIRCLE = Math.PI * 2;

export function getPieDataLabelSourceValue(
    data: PieSeriesData,
    dataLabels: {format?: ValueFormat},
): string | number | null | undefined {
    return dataLabels.format ? data.value : (data.label ?? data.value);
}

export function getPieSegmentPercentage(segment: PieArcDatum<SegmentData>): number {
    return (segment.endAngle - segment.startAngle) / FULL_CIRCLE;
}

export function getPieDataLabelText(args: {
    data: PieSeriesData;
    dataLabels: {format?: ValueFormat};
    percentage: number;
}): string {
    const {data, dataLabels, percentage} = args;

    return getFormattedValue({
        value: getPieDataLabelSourceValue(data, dataLabels),
        format: dataLabels.format,
        percentage,
        name: data.name,
        data,
    });
}
