import type {BaseTextStyle, HtmlItem, SankeySeriesData} from '../../../types';
import type {PreparedSankeySeries} from '../../useSeries/types';

export type SankeyDataLabel = {
    text: string;
    x: number;
    y: number;
    textAnchor: 'start' | 'end';
    style: BaseTextStyle;
};

export type SankeyNode = {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    color: string;
    data: SankeySeriesData;
};

export type SankeyLink = {
    opacity: number;
    color: string;
    path: string | null;
    strokeWidth: number;
    source: SankeySeriesData;
    target: SankeySeriesData;
    value: number;
};

export type PreparedSankeyData = {
    series: PreparedSankeySeries;
    htmlElements: HtmlItem[];
    nodes: SankeyNode[];
    links: SankeyLink[];
    labels: SankeyDataLabel[];
};
