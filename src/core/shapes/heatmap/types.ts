import type {BaseTextStyle, HeatmapSeriesData, HtmlItem} from '../../../types';
import type {PreparedHeatmapSeries} from '../../series/types';

export type HeatmapItem = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    borderColor: string | null;
    borderWidth: number | null;
    data: HeatmapSeriesData;
};

export type HeatmapLabel = {
    x: number;
    y: number;
    text: string;
    textAnchor: 'start' | 'end' | 'middle';
    style: BaseTextStyle;
};

export type PreparedHeatmapData = {
    series: PreparedHeatmapSeries;
    items: HeatmapItem[];
    htmlElements: HtmlItem[];
    labels: HeatmapLabel[];
};
