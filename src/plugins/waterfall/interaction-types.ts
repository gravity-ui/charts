import type {ChartInteractionSeries, MeaningfulAny, WaterfallSeriesData} from '../../types';

export interface WaterfallInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'waterfall'>;
    point: WaterfallSeriesData<T>;
}
