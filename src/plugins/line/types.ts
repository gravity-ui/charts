import type {DashStyle, LineCap, LineJoin} from '~core/constants';
import type {AnnotationAnchor, PreparedAnnotation} from '~core/series/types';
import type {GradientShapeData, MarkerItem, SeriesShapeData} from '~core/shapes/types';
import type {TooltipDataChunkLine} from '~core/types';

import type {
    LabelData,
    LineSeriesData,
    LineSeriesInterpolation,
    LineSeriesLineBaseStyle,
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
    interpolation?: LineSeriesInterpolation;
}

export interface LineTooltipChunk extends Omit<TooltipDataChunkLine, 'series'> {
    series: PreparedLineSeries;
}
