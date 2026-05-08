import type {AreaSeriesData, LabelData} from '../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedAreaSeries} from '../../series/types';
import type {MarkerItem, SeriesShapeData} from '../types';

export type PointData = {
    annotation?: PreparedAnnotation;
    color?: string;
    data: AreaSeriesData;
    /**
     * Source data was null but the point is kept in the shape so the area can
     * fill the gap (e.g. `nullMode: 'zero'` preserves stack baselines). UI
     * affordances — markers, hover markers, data labels, tooltip rows — must
     * skip these points.
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
    series: PreparedAreaSeries;
    x: number;
    y: number | null;
    y0: number;
};

export type MarkerPointData = PointData & {
    y: number;
};

export type PreparedAreaData = {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    markers: MarkerItem[];
    color: string;
    opacity: number;
    width: number;
    series: PreparedAreaSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
} & SeriesShapeData;
