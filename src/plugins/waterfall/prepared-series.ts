import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, ValueFormat, WaterfallSeries, WaterfallSeriesData} from '../../types';

export type PreparedWaterfallSeriesData = WaterfallSeriesData & {index: number};

export type PreparedWaterfallSeries = {
    type: WaterfallSeries['type'];
    connectors: {
        enabled: boolean;
    };
    data: PreparedWaterfallSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
        format?: ValueFormat;
    };
} & BasePreparedSeries;
