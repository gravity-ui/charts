import type {HtmlItem, LabelData} from '../../types';
import type {SymbolType} from '../constants';
import type {AnnotationAnchor, PreparedHaloOptions} from '../series/types';
import type {GradientBBox, GradientCoords} from '../utils/gradient';

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
    halo?: PreparedHaloOptions;
    renderSymbol?: boolean;
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

/** Paint geometry used by line, area and area-range shapes. */
export interface GradientShapeData {
    /** `undefined` recomputes from points; `null` means no drawable gradient. */
    gradientBBox?: GradientBBox | null;
    /** `undefined` recomputes from points; `null` means no drawable gradient. */
    fillGradientBBox?: GradientBBox | null;
    /** `undefined` uses the local bounding box; `null` suppresses the paint. */
    gradientCoords?: GradientCoords | null;
    /** `undefined` uses the local bounding box; `null` suppresses the paint. */
    fillGradientCoords?: GradientCoords | null;
}

export interface TooltipItemData {
    type?: string;
    series?: {type?: string; tooltip?: {enabled?: boolean}};
    point?: {series?: {type?: string}};
}
