import type {BarXSeriesData, ChartInteractionSeries, MeaningfulAny} from '../../types';

export interface BarXInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'bar-x'>;
    point: BarXSeriesData<T>;
}
