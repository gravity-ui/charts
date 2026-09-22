import type {HtmlItem, LabelData} from '../../types';
import type {SymbolType} from '../constants';
import type {AnnotationAnchor} from '../series/types';

/** SVG label data without a required series reference. */
export type SvgLabel = Omit<LabelData, 'series'>;

/**
 * Shared label coordinates and dimensions.
 * SVG coordinates may use a text anchor and baseline instead of the top-left corner.
 */
export interface LabelRect {
    x: number;
    y: number;
    size: {width: number; height: number};
}

export interface ShapeLabels {
    svgLabels?: SvgLabel[];
    htmlLabels: HtmlItem[];
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
    halo?: {size: number; opacity: number};
    hover?: Pick<MarkerItem, 'radius' | 'symbolType' | 'fill' | 'stroke' | 'strokeWidth' | 'halo'>;
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
