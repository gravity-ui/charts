import type {HtmlItem} from '../../../types';
import type {PreparedSankeySeries} from '../../useSeries/types';

export type SankeyDataLabel = {
    text: string;
    x: number;
    y: number;
    textAnchor: 'start' | 'end';
};

export type PreparedSankeyData = {
    series: PreparedSankeySeries;
    htmlElements: HtmlItem[];
    nodes: any[];
    links: any[];
    labels: SankeyDataLabel[];
};
