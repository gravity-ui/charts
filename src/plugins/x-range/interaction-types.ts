import type {ChartInteractionSeries, MeaningfulAny, XRangeSeriesData} from '../../types';

export interface XRangeInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'x-range'>;
    point: XRangeSeriesData<T>;
}
