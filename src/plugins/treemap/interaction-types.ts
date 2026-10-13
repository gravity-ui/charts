import type {ChartInteractionSeries, MeaningfulAny, TreemapSeriesData} from '../../types';

export interface TreemapInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'treemap'>;
    point: TreemapSeriesData<T>;
}
