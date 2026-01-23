import type {DashStyle, LineCap, LineJoin} from '../../../constants';
import type {HtmlItem, LabelData, LineSeriesData, LineSeriesLineBaseStyle} from '../../../types';
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
    color: string;
    dashStyle: DashStyle;
    linecap: LineCap;
    linejoin: LineJoin;
} & Required<LineSeriesLineBaseStyle>;
