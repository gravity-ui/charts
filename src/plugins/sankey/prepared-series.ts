import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, SankeySeries, SankeySeriesData, ValueFormat} from '../../types';

export type PreparedSankeySeries = {
    type: SankeySeries['type'];
    data: SankeySeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        format?: ValueFormat;
    };
} & BasePreparedSeries &
    Omit<SankeySeries, keyof BasePreparedSeries>;
