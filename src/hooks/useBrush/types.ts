import type {BrushBehavior} from 'd3';

import type {ZoomType} from '../../constants';
import type {ChartBrush, DeepRequired} from '../../types';

export type BrushSelection = [number, number] | [[number, number], [number, number]];

export interface BrushArea {
    /**
     * Array of points [[x0, y0], [x1, y1]], where [x0, y0] is the top-left corner
     * and [x1, y1] is the bottom-right corner.
     *
     * The brush extent determines the size of the invisible overlay and also constrains the brush selection;
     * the brush selection cannot go outside the brush extent.
     */
    extent: [[number, number], [number, number]];
}

export interface UseBrushProps {
    areas: BrushArea[];
    node: SVGGElement | null;
    brushOptions?: DeepRequired<ChartBrush>;
    disabled?: boolean;
    onBrush?: (
        this: SVGGElement,
        brushInstance: BrushBehavior<unknown>,
        selection: BrushSelection,
    ) => void;
    onBrushEnd?: (
        this: SVGGElement,
        brushInstance: BrushBehavior<unknown>,
        selection: BrushSelection | null,
    ) => void;
    onBrushStart?: (
        this: SVGGElement,
        brushInstance: BrushBehavior<unknown>,
        selection: BrushSelection,
    ) => void;
    selection?: BrushSelection;
    type?: ZoomType;
}
