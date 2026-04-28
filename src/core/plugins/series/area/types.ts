import type {AreaSeriesData, HtmlItem, LabelData} from '../../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedAreaSeries} from '../../../series/types';

export type PointData = {
    annotation?: PreparedAnnotation;
    color?: string;
    data: AreaSeriesData;
    hiddenInLine?: boolean;
    series: PreparedAreaSeries;
    x: number;
    y: number | null;
    y0: number;
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
    type: 'area';
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
