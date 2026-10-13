import type {BarYSeriesData, ChartInteractionSeries, MeaningfulAny} from '../../types';

export interface BarYInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'bar-y'>;
    point: BarYSeriesData<T>;
}
