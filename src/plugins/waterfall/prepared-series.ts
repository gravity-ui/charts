import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, ValueFormat, WaterfallSeries, WaterfallSeriesData} from '../../types';
import type {PreparedBarLabelPlacement} from '../bar-label-placement';

export type PreparedWaterfallSeriesData = WaterfallSeriesData & {index: number};

export type PreparedWaterfallSeries = {
    type: WaterfallSeries['type'];
    connectors: {
        enabled: boolean;
    };
    data: PreparedWaterfallSeriesData[];
    /** Complete group data for resolving balances across the visible range. */
    fullData: readonly PreparedWaterfallSeriesData[];
    dataLabels: PreparedBarLabelPlacement & {
        enabled: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
        format?: ValueFormat;
    };
} & BasePreparedSeries;
