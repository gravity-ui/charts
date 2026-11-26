import type {PreparedHeatmapSeries} from '~core/series/types';
import type {SeriesShapeData} from '~core/shapes/types';

import type {BaseTextStyle, HeatmapSeriesData} from '../../types';

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
    labels: HeatmapLabel[];
} & SeriesShapeData;
