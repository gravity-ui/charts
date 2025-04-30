import type {HtmlItem, LabelData} from '../../../types';
import type {PreparedRadarSeries} from '../../useSeries/types';

export type RadarShapeData = {
    points: [number, number][];
    path: string | null;
    color: string;
    series: PreparedRadarSeries;
    hovered: boolean;
    active: boolean;
    borderColor: string;
    borderWidth: number;
    fillOpacity: number;
};

export type RadarLabelData = LabelData & {
    maxWidth: number;
};

export type RadarAxisData = {
    angle: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
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

export type PreparedRadarData = {
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
    series: PreparedRadarSeries;
};
