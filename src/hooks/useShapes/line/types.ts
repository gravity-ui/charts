import type {DashStyle, LineCap, LineJoin} from '~core/constants';
import type {PreparedAnnotation, PreparedLineSeries} from '~core/series/types';

import type {HtmlItem, LabelData, LineSeriesData, LineSeriesLineBaseStyle} from '../../../types';
import type {AnnotationAnchor} from '../annotation';

export type PointData = {
    x: number | null;
    y: number | null;
    data: LineSeriesData;
    series: PreparedLineSeries;
    annotation?: PreparedAnnotation;
    color?: string;
};
export type MarkerPointData = PointData & {y: number; x: number};
export type MarkerData = {
    point: MarkerPointData;
    active: boolean;
    hovered: boolean;
    clipped: boolean;
};

export type PreparedLineData = {
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
