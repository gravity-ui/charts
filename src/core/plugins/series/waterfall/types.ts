import type {HtmlItem, LabelData, WaterfallSeriesData} from '../../../../types';
import type {PreparedWaterfallSeries} from '../../../series/types';

export type PreparedWaterfallData = {
    type: 'waterfall';
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
