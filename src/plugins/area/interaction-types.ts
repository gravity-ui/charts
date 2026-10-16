import type {
    AreaSeriesData,
    ChartInteractionSeries,
    ChartShapePoint,
    MeaningfulAny,
} from '~core/types';

export interface AreaInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'area'>;
    point: AreaSeriesData<T> | ChartShapePoint<AreaSeriesData<T>>;
}
