import type {BrushBehavior} from 'd3';

import type {ChartBrush, DeepRequired} from '../../types';
import type {PreparedZoom} from '../useChartOptions/types';

type BrushType = PreparedZoom['type'];
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
    type?: BrushType;
    brushOptions?: DeepRequired<ChartBrush>;
    onBrushStart?: (this: SVGGElement, brushInstance: BrushBehavior<unknown>) => void;
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
    selection?: BrushSelection;
}
