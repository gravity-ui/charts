import type {SymbolType} from '~core/constants';
import type {
    BasePreparedAxisRelatedSeries,
    BasePreparedSeries,
    PreparedHaloOptions,
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
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: AreaValueFormat;
    };
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                /** Whether permanent markers can use hover styles. Defaults to true. */
                enabledForNormal?: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
    gradient?: LinearGradient;
    fillColor: string;
    fillGradient?: LinearGradient;
    yAxis: number;
} & BasePreparedSeries<AreaSeries['tooltip']> &
    BasePreparedAxisRelatedSeries;
