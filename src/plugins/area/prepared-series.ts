import type {
    BasePreparedAxisRelatedSeries,
    BasePreparedSeries,
    PreparedSeriesMarker,
} from '~core/series/types';
import type {SeriesGradientState} from '~core/utils/gradient-reference';

import type {
    AreaSeries,
    AreaSeriesData,
    AreaValueFormat,
    BaseTextStyle,
    LinearGradient,
} from '../../types';

export type PreparedAreaSeries = {
    type: AreaSeries['type'];
    /** Full-series paint references, shared across filtered copies. */
    gradientState?: SeriesGradientState;
    /** Complete data for stack sections neighboring the visible range. */
    fullData?: AreaSeriesData[];
    data: AreaSeriesData[];
    stacking: AreaSeries['stacking'];
    stackLabels?: AreaSeries['stackLabels'];
    stackId: string;
    valueAxis: 'y';
    lineWidth: number;
    opacity: number;
    nullMode: AreaSeries['nullMode'];
    interpolation?: AreaSeries['interpolation'];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: AreaValueFormat;
    };
    marker: PreparedSeriesMarker;
    gradient?: LinearGradient;
    fillColor: string;
    fillGradient?: LinearGradient;
    yAxis: number;
} & BasePreparedSeries<AreaSeries['tooltip']> &
    BasePreparedAxisRelatedSeries;
