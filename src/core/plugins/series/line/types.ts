import type {HtmlItem, LabelData, LineSeriesData, LineSeriesLineBaseStyle} from '../../../../types';
import type {DashStyle, LineCap, LineJoin} from '../../../constants';
import type {AnnotationAnchor, PreparedAnnotation, PreparedLineSeries} from '../../../series/types';

export type PointData = {
    annotation?: PreparedAnnotation;
    color?: string;
    data: LineSeriesData;
    hiddenInLine?: boolean;
    series: PreparedLineSeries;
    x: number | null;
    y: number | null;
};
export type MarkerPointData = PointData & {y: number; x: number};
export type MarkerData = {
    point: MarkerPointData;
    active: boolean;
    hovered: boolean;
    clipped: boolean;
};

export type PreparedLineData = {
    type: 'line';
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    markers: MarkerData[];
    series: PreparedLineSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
    color: string;
    dashStyle: DashStyle;
    linecap: LineCap;
    linejoin: LineJoin;
} & Required<LineSeriesLineBaseStyle>;
