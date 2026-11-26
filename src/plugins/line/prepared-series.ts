import type {DashStyle, LineCap, LineJoin} from '~core/constants';
import type {
    BasePreparedAxisRelatedSeries,
    BasePreparedSeries,
    PreparedSeriesMarker,
} from '~core/series/types';
import type {SeriesGradientState} from '~core/utils/gradient-reference';

import type {
    BaseTextStyle,
    LineSeries,
    LineSeriesData,
    LineSeriesDataLabelPlacementFallback,
    LineSeriesDataLabelPlacementPosition,
    LineSeriesDataLabels,
    LinearGradient,
    SeriesInterpolation,
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
    marker: PreparedSeriesMarker;
    dashStyle: DashStyle;
    linecap: LineCap;
    linejoin: LineJoin;
    interpolation?: SeriesInterpolation;
    opacity: number | null;
    gradient?: LinearGradient;
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;
