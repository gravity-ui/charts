import type {ShapeLabels} from '~core/shapes/types';

import type {BaseTextStyle, SankeySeriesData, TooltipDataChunkSankey} from '../../types';

import type {PreparedSankeySeries} from './prepared-series';

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
    nodes: SankeyNode[];
    links: SankeyLink[];
    labels: SankeyDataLabel[];
} & Pick<ShapeLabels, 'htmlLabels'>;

export interface SankeyTooltipChunk extends Omit<TooltipDataChunkSankey, 'series'> {
    series: PreparedSankeySeries;
}
