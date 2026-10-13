import type {
    LabelData,
    LineSeriesData,
    LineSeriesInterpolation,
    LineSeriesLineBaseStyle,
} from '../../../types';
import type {DashStyle, LineCap, LineJoin} from '../../constants';
import type {AnnotationAnchor, PreparedAnnotation, PreparedLineSeries} from '../../series/types';
import type {GradientShapeData, MarkerItem, SeriesShapeData} from '../types';

export interface PointData {
    annotation?: PreparedAnnotation;
    color?: string;
    data: LineSeriesData;
    fill?: string;
    hiddenInLine?: boolean;
    series: PreparedLineSeries;
    x: number | null;
    y: number | null;
    clipped?: boolean;
}
export type MarkerPointData = PointData & {y: number; x: number};

export interface PreparedLineData
    extends Required<LineSeriesLineBaseStyle>, SeriesShapeData, GradientShapeData {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    markers: MarkerItem[];
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
