import type {ChartInteractionSeries, MeaningfulAny, WaterfallSeriesData} from '~core/types';

export interface WaterfallInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'waterfall'>;
    point: WaterfallSeriesData<T>;
}
