import type {HtmlItem, LabelData, WaterfallSeriesData} from '../../../types';
import type {PreparedWaterfallSeries} from '../../useSeries/types';

export type PreparedWaterfallData = {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number | null;
    series: PreparedWaterfallSeries;
    data: WaterfallSeriesData;
    label?: LabelData;
    subTotal: number;
    htmlElements: HtmlItem[];
};
