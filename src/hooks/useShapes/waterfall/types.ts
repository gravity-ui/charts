import type {PreparedWaterfallSeries} from '~core/series/types';

import type {HtmlItem, LabelData, WaterfallSeriesData} from '../../../types';

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
