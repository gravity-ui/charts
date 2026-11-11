import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, FunnelSeries, FunnelSeriesData, ValueFormat} from '../../types';

export type PreparedFunnelSeries = {
    type: FunnelSeries['type'];
    data: FunnelSeriesData;
    shape: Required<FunnelSeries>['shape'];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        html: boolean;
        format?: ValueFormat;
        align: Required<Required<FunnelSeries>['dataLabels']>['align'];
        inside: boolean;
        reserveSpace: boolean;
        padding: number;
        anchor: Required<Required<FunnelSeries>['dataLabels']>['anchor'];
        preserveLineBreaks: boolean;
    };
    connectors: Required<FunnelSeries['connectors']>;
    opacity: number | null;
} & BasePreparedSeries;
