import type {ChartInteractionSeries, MeaningfulAny, PieSeriesData} from '~core/types';

export interface PieInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'pie'>;
    point: PieSeriesData<T>;
}
