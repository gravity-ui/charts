import type {HtmlItem, LabelData, RadarSeriesData} from '../../../types';
import type {PreparedRadarSeries} from '../../useSeries/types';

export type RadarLabelData = LabelData & {
    maxWidth: number;
};

export type RadarAxisData = {
    point: [number, number];
    angle: number;
    strokeColor: string;
    strokeWidth: number;
    radar: PreparedRadarData;
};

export type RadarGridData = {
    path: [number, number][];
    strokeColor: string;
    strokeWidth: number;
};

export type PointData = {
    x: number;
    y: number;
    data: RadarSeriesData;
    series: PreparedRadarSeries;
};

export type RadarMarkerData = {
    point: PointData;
    radius: number;
    position: [number, number];
    index: number;
    color: string;
    opacity: number;
    data: RadarSeriesData;
    series: PreparedRadarSeries;
    hovered: boolean;
    active: boolean;
};

export type RadarShapeData = {
    points: RadarMarkerData[];
    path: string;
    color: string;
    series: PreparedRadarSeries;
    hovered: boolean;
    active: boolean;
    borderColor: string;
    borderWidth: number;
    fillOpacity: number;
};

export type PreparedRadarData = {
    type: 'radar';
    id: string;
    shapes: RadarShapeData[];
    labels: RadarLabelData[];
    axes: RadarAxisData[];
    grid: RadarGridData[];
    center: [number, number];
    radius: number;
    htmlLabels: HtmlItem[];
    cursor: string | null;
};
