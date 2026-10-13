import type {ChartInteractionSeries, FunnelSeriesData, MeaningfulAny} from '../../types';

export interface FunnelInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'funnel'>;
    point: FunnelSeriesData<T>;
}
