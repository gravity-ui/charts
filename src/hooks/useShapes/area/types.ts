import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import type {PreparedAreaSeries} from '../../useSeries/types';

export type PointData = {
    y0: number;
    x: number;
    y: number | null;
    data: AreaSeriesData;
    series: PreparedAreaSeries;
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
    id: string;
    points: PointData[];
    markers: MarkerData[];
    color: string;
    opacity: number;
    width: number;
    series: PreparedAreaSeries;
    hovered: boolean;
    active: boolean;
    labels: LabelData[];
    htmlElements: HtmlItem[];
};
