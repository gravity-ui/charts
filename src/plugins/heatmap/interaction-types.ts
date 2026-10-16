import type {ChartInteractionSeries, HeatmapSeriesData, MeaningfulAny} from '~core/types';

export interface HeatmapInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'heatmap'>;
    point: HeatmapSeriesData<T>;
}
