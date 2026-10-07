import type {HtmlItem, LabelData, ScatterClusterData, ScatterSeriesData} from '../../../types';
import type {PreparedScatterSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

interface PointData {
    x: number;
    y: number;
    opacity: number | null;
    data: ScatterClusterData;
    sourceData?: ScatterSeriesData;
    series: PreparedScatterSeries;
    color: string;
}

export interface ScatterSvgLabelData extends LabelData {
    cluster?: true;
}

export type MarkerData = {
    point: PointData;
    active: boolean;
    hovered: boolean;
    htmlElements: HtmlItem[];
    clipped: boolean;
};

export type PreparedScatterData = MarkerData;

export type PreparedScatterShapeData = {
    scatterData: PreparedScatterData[];
    svgLabels: ScatterSvgLabelData[];
} & SeriesShapeData;
