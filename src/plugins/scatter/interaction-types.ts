import type {ChartInteractionSeries, MeaningfulAny, ScatterClusterData} from '~core/types';

export interface ScatterInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'scatter'>;
    point: ScatterClusterData<T>;
}
