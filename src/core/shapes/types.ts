import type {HtmlItem} from '../../types';
import type {SymbolType} from '../constants';
import type {AnnotationAnchor} from '../series/types';

/**
 * Shared label coordinates and dimensions.
 * SVG coordinates may use a text anchor and baseline instead of the top-left corner.
 */
export interface LabelRect {
    x: number;
    y: number;
    size: {width: number; height: number};
}

export interface MarkerItem {
    cx: number;
    cy: number;
    radius: number;
    symbolType: `${SymbolType}`;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    active: boolean;
    clipped: boolean;
    series: {id: string};
    data: unknown;
}

export interface HoveredShapeData {
    data: unknown;
    series?: {id?: string};
    x?: number;
    y1?: number;
}

export interface SeriesShapeData {
    htmlLabels: HtmlItem[];
    markers: MarkerItem[];
    annotations: AnnotationAnchor[];
    getHoverMarkers(hoveredData: HoveredShapeData[]): MarkerItem[];
}

export interface TooltipItemData {
    type?: string;
    series?: {type?: string; tooltip?: {enabled?: boolean}};
    point?: {series?: {type?: string}};
}
