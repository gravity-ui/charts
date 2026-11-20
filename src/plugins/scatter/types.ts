import type {ShapeLabels} from '~core/shapes/types';
import type {TooltipDataChunkScatter} from '~core/types';

import type {HtmlItem, LabelData, ScatterClusterData, ScatterSeriesData} from '../../types';

import type {PreparedScatterSeries} from './prepared-series';

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
} & Pick<ShapeLabels, 'htmlLabels'>;

export interface ScatterTooltipChunk extends Omit<TooltipDataChunkScatter, 'series'> {
    series: PreparedScatterSeries;
}
