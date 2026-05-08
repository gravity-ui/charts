import type {LabelData, LineSeriesData, LineSeriesLineBaseStyle} from '../../../types';
import type {DashStyle, LineCap, LineJoin} from '../../constants';
import type {AnnotationAnchor, PreparedAnnotation, PreparedLineSeries} from '../../series/types';
import type {MarkerItem, SeriesShapeData} from '../types';

export type PointData = {
    annotation?: PreparedAnnotation;
    color?: string;
    data: LineSeriesData;
    /**
     * Source data was null but the point is kept in the shape so the line can
     * fill the gap (e.g. `nullMode: 'zero'`). UI affordances — markers, hover
     * markers, data labels, tooltip rows — must skip these points.
     */
    excluded?: boolean;
    /**
     * Set by `markHiddenPointsOutOfYRange` for points whose y falls outside the
     * axis range AND whose neighbors are also out of range. The path generator
     * uses it via `.defined()` to break the path so the rendered shape ends at
     * the last visible point. Out-of-range points kept as anchors (have at
     * least one in-range neighbor) are NOT marked — they retain their pixel y
     * to preserve path slope at the plot edges.
     */
    hiddenInLine?: boolean;
    series: PreparedLineSeries;
    x: number | null;
    y: number | null;
};
export type MarkerPointData = PointData & {y: number; x: number};

export type PreparedLineData = {
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
} & Required<LineSeriesLineBaseStyle> &
    SeriesShapeData;
