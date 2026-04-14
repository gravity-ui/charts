import type {HtmlItem, LabelData, ScatterSeriesData} from '../../../types';
import type {PreparedScatterSeries} from '../../series/types';

type PointData = {
    x: number;
    y: number;
    opacity: number | null;
    data: ScatterSeriesData;
    series: PreparedScatterSeries;
    color: string;
};

export type MarkerData = {
    point: PointData;
    active: boolean;
    hovered: boolean;
    htmlElements: HtmlItem[];
    clipped: boolean;
};

export type PreparedScatterData = MarkerData;

export type PreparedScatterShapeData = {
    markers: PreparedScatterData[];
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
};
