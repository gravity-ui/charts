import type {PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import type {PreparedSeries} from '../series/types';
import type {ChartMargin} from '../types';

import type {TooltipItemData} from './types';

export interface ShapeClipRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const boundsByShape = new WeakMap<TooltipItemData, ReadonlyMap<string, ShapeClipRect>>();

export function getPaddedSeriesBounds(args: {
    padding?: ChartMargin[];
    width: number;
    split: PreparedSplit;
    yAxis: PreparedYAxis[];
    series: PreparedSeries[];
}) {
    const {padding, width, split, yAxis, series} = args;
    const result = new Map<string, ShapeClipRect>();
    if (!padding?.some((p) => Object.values(p).some((size) => size > 0))) return result;
    const rects = split.plots.map((plot, index) => {
        const p = padding[index] ?? {left: 0, right: 0, top: 0, bottom: 0};
        return {
            x: p.left,
            y: plot.top + p.top,
            width: Math.max(0, width - p.left - p.right),
            height: Math.max(0, plot.height - p.top - p.bottom),
        };
    });
    for (const item of series) {
        if ('yAxis' in item) {
            const rect = rects[yAxis[item.yAxis]?.plotIndex];
            if (rect) result.set(item.id, rect);
        }
    }
    return result;
}

export function isInsideClipRect(rect: ShapeClipRect, x: number, y0: number, y1 = y0) {
    return (
        x >= rect.x - 0.5 &&
        x <= rect.x + rect.width + 0.5 &&
        Math.max(y0, y1) >= rect.y - 0.5 &&
        Math.min(y0, y1) <= rect.y + rect.height + 0.5
    );
}

export function setShapeClipBounds(
    shapes: TooltipItemData[],
    bounds: ReadonlyMap<string, ShapeClipRect>,
) {
    for (const shape of shapes) boundsByShape.set(shape, bounds);
}

export function getShapeClipPredicate(shapes: TooltipItemData[]) {
    const bounds = new Map<string, ShapeClipRect>();
    const sources = new Set(shapes.map((shape) => boundsByShape.get(shape)));
    for (const source of sources) {
        source?.forEach((rect, id) => bounds.set(id, rect));
    }
    return (seriesId: string, x: number, y0: number, y1 = y0) => {
        const rect = bounds.get(seriesId);
        return !rect || isInsideClipRect(rect, x, y0, y1);
    };
}
