import type {DashStyle, LineCap, LineJoin, SymbolType} from '~core/constants';
import type {
    BasePreparedAxisRelatedSeries,
    BasePreparedSeries,
    PreparedHaloOptions,
} from '~core/series/types';
import type {SeriesGradientState} from '~core/utils/gradient-reference';

import type {
    BaseTextStyle,
    LineSeries,
    LineSeriesData,
    LineSeriesDataLabelPlacementFallback,
    LineSeriesDataLabelPlacementPosition,
    LineSeriesDataLabels,
    LineSeriesInterpolation,
    LinearGradient,
    ValueFormat,
} from '../../types';

export type PreparedLineSeries = {
    type: LineSeries['type'];
    /** Full-series paint references, shared across filtered copies. */
    gradientState?: SeriesGradientState;
    data: LineSeriesData[];
    lineWidth: number;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
        placement: 'auto' | LineSeriesDataLabelPlacementPosition[];
        placementFallback: LineSeriesDataLabelPlacementFallback;
        anchor: NonNullable<LineSeriesDataLabels['anchor']>;
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
    dashStyle: DashStyle;
    linecap: LineCap;
    linejoin: LineJoin;
    interpolation?: LineSeriesInterpolation;
    opacity: number | null;
    gradient?: LinearGradient;
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;
