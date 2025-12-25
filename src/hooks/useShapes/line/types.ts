import type {HtmlItem, LabelData, LineSeriesData, LineSeriesLineStyle} from '../../../types';
import type {PreparedLineSeries} from '../../useSeries/types';

export type PointData = {
    x: number | null;
    y: number | null;
    data: LineSeriesData;
    series: PreparedLineSeries;
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
    id: string;
    points: PointData[];
    markers: MarkerData[];
    series: PreparedLineSeries;
    hovered: boolean;
    active: boolean;
    labels: LabelData[];
    htmlElements: HtmlItem[];
} & Required<LineSeriesLineStyle>;
