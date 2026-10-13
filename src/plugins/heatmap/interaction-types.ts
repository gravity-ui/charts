import type {ChartInteractionSeries, HeatmapSeriesData, MeaningfulAny} from '../../types';

export interface HeatmapInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'heatmap'>;
    point: HeatmapSeriesData<T>;
}
