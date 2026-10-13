import type {
    ChartInteractionSeries,
    ChartShapePoint,
    MeaningfulAny,
    RadarSeriesData,
} from '../../types';

export interface RadarInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'radar'>;
    point: RadarSeriesData<T> | ChartShapePoint<RadarSeriesData<T>>;
}
