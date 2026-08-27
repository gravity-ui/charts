import type {HtmlItem} from '../../types';
import type {SymbolType} from '../constants';
import type {AnnotationAnchor} from '../series/types';

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
