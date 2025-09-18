import type {DashStyle, LineCap} from '../../../constants';
import type {HtmlItem, LabelData, LineSeriesData} from '../../../types';
import type {PreparedLineSeries} from '../../useSeries/types';

export type PointData = {
    x: number;
    y: number;
    data: LineSeriesData;
    series: PreparedLineSeries;
    color?: string;
};

export type MarkerData = {
    point: PointData;
    active: boolean;
    hovered: boolean;
    clipped: boolean;
};

export type PreparedLineData = {
    id: string;
    points: PointData[];
    markers: MarkerData[];
    color: string;
    width: number;
    series: PreparedLineSeries;
    hovered: boolean;
    active: boolean;
    labels: LabelData[];
    dashStyle: DashStyle;
    linecap: LineCap;
    opacity: number | null;
    htmlElements: HtmlItem[];
};
