import type {DashStyle} from '~core/constants';
import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, ValueFormat, XRangeSeries, XRangeSeriesData} from '../../types';

export type PreparedXRangeSeries = {
    type: XRangeSeries['type'];
    data: XRangeSeriesData[];
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    borderDashStyle: DashStyle;
    opacity: number | null;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        html: boolean;
        padding: number;
        format?: ValueFormat;
    };
} & BasePreparedSeries;
