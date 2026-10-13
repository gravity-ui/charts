import type {
    ChartInteractionSeries,
    ChartShapePoint,
    LineSeriesData,
    MeaningfulAny,
} from '../../types';

export interface LineInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'line'>;
    point: LineSeriesData<T> | ChartShapePoint<LineSeriesData<T>>;
}
