import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedAreaSeries} from '../../series/types';

export type PointData = {
    y0: number;
    x: number;
    y: number | null;
    data: AreaSeriesData;
    series: PreparedAreaSeries;
    annotation?: PreparedAnnotation;
    color?: string;
};

export type MarkerPointData = PointData & {
    y: number;
};

export type MarkerData = {
    point: MarkerPointData;
    active: boolean;
    hovered: boolean;
    clipped: boolean;
};

export type PreparedAreaData = {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    markers: MarkerData[];
    color: string;
    opacity: number;
    width: number;
    series: PreparedAreaSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
};
