import type {ChartInteractionSeries, MeaningfulAny, TreemapSeriesData} from '~core/types';

export interface TreemapInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'treemap'>;
    point: TreemapSeriesData<T>;
}
