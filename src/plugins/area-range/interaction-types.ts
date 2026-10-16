import type {
    AreaRangeSeriesData,
    ChartInteractionSeries,
    ChartShapePoint,
    MeaningfulAny,
} from '~core/types';

export interface AreaRangeInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'area-range'>;
    point: AreaRangeSeriesData<T> | ChartShapePoint<AreaRangeSeriesData<T>>;
}
