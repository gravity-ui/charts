import type {ChartInteractionSeries, MeaningfulAny, ScatterClusterData} from '../../types';

export interface ScatterInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'scatter'>;
    point: ScatterClusterData<T>;
}
