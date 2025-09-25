import {SeriesType} from '../../constants';
import type {ChartSeries} from '../../types';

export const SERIES_TYPES_WITH_AXES: ChartSeries['type'][] = [
    SeriesType.Area,
    SeriesType.BarX,
    SeriesType.BarY,
    SeriesType.Line,
    SeriesType.Scatter,
    SeriesType.Waterfall,
];
