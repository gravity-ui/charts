import type {ChartInteractionSeries, MeaningfulAny, PieSeriesData} from '../../types';

export interface PieInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'pie'>;
    point: PieSeriesData<T>;
}
