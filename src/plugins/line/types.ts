import type {DashStyle, LineCap, LineJoin} from '~core/constants';
import type {AnnotationAnchor, PreparedAnnotation} from '~core/series/types';
import type {GradientShapeData, MarkerItem, SeriesShapeData} from '~core/shapes/types';

import type {
    LabelData,
    LineSeriesData,
    LineSeriesLineBaseStyle,
    SeriesInterpolation,
} from '../../types';

import type {PlacementSegment} from './auto-placement';
import type {PreparedLineSeries} from './prepared-series';

export interface PointData {
    annotation?: PreparedAnnotation;
    color?: string;
    data: LineSeriesData;
    fill?: string;
    hiddenInLine?: boolean;
    series: PreparedLineSeries;
    x: number | null;
    y: number | null;
}
export type MarkerPointData = PointData & {y: number; x: number};

export interface PreparedLineData
    extends Required<LineSeriesLineBaseStyle>, SeriesShapeData, GradientShapeData {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    /**
     * Top and bottom edges of the series' plot, in pixels from the top of the chart's plotting area.
     * In a split chart, this keeps a smooth curve with offscreen anchors out of adjacent plots.
     */
    clipYRange?: readonly [top: number, bottom: number];
    markers: MarkerItem[];
    /**
     * Straight pieces of the drawn line (curves flattened), built on first use and cached.
     * Shared by data label placement and the pointer distance measurement.
     */
    getSegments: () => PlacementSegment[];
    series: PreparedLineSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
    color: string;
    dashStyle: DashStyle;
    linecap: LineCap;
    linejoin: LineJoin;
    interpolation?: SeriesInterpolation;
}
