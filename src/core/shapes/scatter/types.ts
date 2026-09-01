import type {
    BaseTextStyle,
    HtmlItem,
    LabelData,
    ScatterClusterData,
    ScatterSeriesData,
} from '../../../types';
import type {PreparedScatterSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

interface PointData {
    x: number;
    y: number;
    opacity: number | null;
    data: ScatterSeriesData | ScatterClusterData;
    series: PreparedScatterSeries;
    color: string;
}

export interface ScatterClusterLabelData {
    cluster: true;
    text: string;
    x: number;
    y: number;
    textAnchor: 'middle';
    style: BaseTextStyle;
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
    svgLabels: LabelData[];
    clusterLabels: ScatterClusterLabelData[];
} & SeriesShapeData;
