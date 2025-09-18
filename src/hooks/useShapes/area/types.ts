import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import type {PreparedAreaSeries} from '../../useSeries/types';

export type PointData = {
    y0: number;
    x: number;
    y: number;
    data: AreaSeriesData;
    series: PreparedAreaSeries;
    color?: string;
};

export type MarkerData = {
    point: PointData;
    active: boolean;
    hovered: boolean;
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
