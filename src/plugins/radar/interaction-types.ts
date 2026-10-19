import type {
    ChartInteractionSeries,
    ChartShapePoint,
    MeaningfulAny,
    RadarSeriesData,
} from '~core/types';

export interface RadarInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'radar'>;
    point: RadarSeriesData<T> | ChartShapePoint<RadarSeriesData<T>>;
}
