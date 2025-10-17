import type {HtmlItem} from '../../../types';

export type HeatMapItem = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
};

export type PreparedHeatmapData = {
    items: HeatMapItem[];
    htmlElements: HtmlItem[];
};
