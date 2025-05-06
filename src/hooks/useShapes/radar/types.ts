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

export type RadarMarkerData = {
    radius: number;
    x: number;
    y: number;
    color: string;
    opacity: number;
};

export type RadarShapeData = {
    points: {
        position: [number, number];
        index: number;
        data: RadarSeriesData;
        series: PreparedRadarSeries;
    }[];
    path: string | null;
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
    markers: RadarMarkerData[];
    labels: RadarLabelData[];
    axes: RadarAxisData[];
    grid: RadarGridData[];
    center: [number, number];
    radius: number;
    htmlLabels: HtmlItem[];
    cursor: string | null;
};
