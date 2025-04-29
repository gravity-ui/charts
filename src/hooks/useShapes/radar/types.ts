import type {HtmlItem, LabelData} from '../../../types';
import type {PreparedRadarSeries} from '../../useSeries/types';

export type RadarPointData = {
    value: number;
    color: string;
    opacity: number | null;
    series: PreparedRadarSeries;
    hovered: boolean;
    active: boolean;
    radar: PreparedRadarData;
    x: number;
    y: number;
    index: number;
};

export type RadarLabelData = LabelData & {
    point: RadarPointData;
    maxWidth: number;
};

export type RadarAxisData = {
    name: string;
    angle: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

export type PreparedRadarData = {
    id: string;
    points: RadarPointData[];
    labels: RadarLabelData[];
    axes: RadarAxisData[];
    center: [number, number];
    radius: number;
    borderColor: string;
    borderWidth: number;
    fillOpacity: number;
    series: PreparedRadarSeries;
    htmlLabels: HtmlItem[];
};
