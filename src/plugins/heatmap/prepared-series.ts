import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, HeatmapSeries, HeatmapSeriesData, ValueFormat} from '../../types';

export type PreparedHeatmapSeries = {
    type: HeatmapSeries['type'];
    data: HeatmapSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        html: boolean;
        format?: ValueFormat;
    };
    borderWidth: number;
    borderColor: string;
} & BasePreparedSeries;
