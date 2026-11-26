import type {BasePreparedAxisRelatedSeries, BasePreparedSeries} from '~core/series/types';
import type {SeriesGradientState} from '~core/utils/gradient-reference';

import type {
    AreaRangeSeries,
    AreaRangeSeriesData,
    BaseTextStyle,
    LinearGradient,
    ValueFormat,
} from '../../types';
import type {PreparedAreaSeries} from '../area/prepared-series';

export type PreparedAreaRangeSeries = {
    type: AreaRangeSeries['type'];
    /** Full-series paint references, shared across filtered copies. */
    gradientState?: SeriesGradientState;
    data: AreaRangeSeriesData[];
    lineWidth: number;
    opacity: number;
    nullMode: AreaRangeSeries['nullMode'];
    marker: PreparedAreaSeries['marker'];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
    };
    gradient?: LinearGradient;
    fillColor: string;
    fillGradient?: LinearGradient;
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;
