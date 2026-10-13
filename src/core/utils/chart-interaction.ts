import {color as parseColor} from 'd3-color';
import {select} from 'd3-selection';

import type {ChartInteractionItem, ChartShapePoint, PointPosition} from '../../types';
import type {SeriesShapeData} from '../shapes/types';

import type {ShapePoint} from './tooltip-helpers';

export interface PrepareNearestDataArgs<TShapeData = unknown> {
    data: TShapeData[];
}

/** A plugin-owned reference position in plot-relative pixels. */
export interface NearestCandidate {
    position: PointPosition;
    item: ChartInteractionItem;
}

/** Reuse unfiltered axis-point preparation without its X-first tooltip selection. */
export function getPointCandidates(points: ShapePoint[]): NearestCandidate[] {
    return points.map((point) => ({
        position: [point.sourceX ?? point.x, (point.y0 + point.y1) / 2],
        item: {point: point.data, series: point.series} as ChartInteractionItem,
    }));
}

/** Compare every candidate in the same pixel metric, independently of plugin iteration order. */
export function getNearestItem(
    position: PointPosition,
    candidates: NearestCandidate[],
    seriesOrder: string[],
): ChartInteractionItem | null {
    const order = new Map(seriesOrder.map((id, index) => [id, index]));
    let nearest: ChartInteractionItem | null = null;
    let minDistance = Infinity;
    let nearestOrder = Infinity;
    for (const candidate of candidates) {
        const distance = Math.hypot(
            position[0] - candidate.position[0],
            position[1] - candidate.position[1],
        );
        if (!Number.isFinite(distance)) continue;
        const candidateOrder = order.get(candidate.item.series.id) ?? Infinity;
        if (distance < minDistance || (distance === minDistance && candidateOrder < nearestOrder)) {
            nearest = candidate.item;
            minDistance = distance;
            nearestOrder = candidateOrder;
        }
    }
    return nearest;
}

export interface InteractionElement {
    element: SVGGeometryElement;
    item: ChartInteractionItem;
}

export interface InteractionElementsArgs {
    plot: SVGGElement;
    markers: SVGGElement;
    preparedData: SeriesShapeData[];
}

const layers = new WeakMap<SVGGElement, () => InteractionElement[]>();

/** Shared render pipeline registration; series renderers do not bind interaction handlers. */
export function registerInteractionLayer(
    plot: SVGGElement,
    getElements: () => InteractionElement[],
) {
    layers.set(plot, getElements);
    return () => {
        layers.delete(plot);
    };
}

/** Read existing D3 data without changing the renderer or exposing DOM nodes to applications. */
export function getInteractionElements<T>(
    root: SVGGElement,
    selector: string,
    getItem: (datum: T) => ChartInteractionItem | undefined,
): InteractionElement[] {
    return Array.from(root.querySelectorAll<SVGGeometryElement>(selector)).flatMap((element) => {
        const item = getItem(select<SVGGeometryElement, T>(element).datum());
        return item ? [{element, item}] : [];
    });
}

const shapePoints = new WeakMap<object, ChartShapePoint<unknown>>();

export function getShapePoint<T>(shape: object, points: {data: T}[]): ChartShapePoint<T> {
    let point = shapePoints.get(shape);
    if (!point) {
        point = {kind: 'shape', points: points.map((p) => p.data)};
        shapePoints.set(shape, point);
    }
    return point as ChartShapePoint<T>;
}

function toLocal(position: PointPosition, element: SVGGraphicsElement): DOMPoint | null {
    const matrix = element.getScreenCTM();
    if (!matrix || matrix.a * matrix.d === matrix.b * matrix.c) return null;
    return new DOMPoint(...position).matrixTransform(matrix.inverse());
}

/** Tests current paint geometry, not bounding boxes or the browser's topmost event target. */
export function getChartTargets(
    svg: SVGSVGElement,
    position: PointPosition,
): ChartInteractionItem[] {
    const elements = Array.from(svg.querySelectorAll<SVGGElement>('g')).flatMap(
        (plot) => layers.get(plot)?.() ?? [],
    );
    const styles = new Map<Element, CSSStyleDeclaration>();
    const visible = new Map<Element, boolean>();
    const paintVisibility = new Map<string, boolean>();
    const hasVisiblePaint = (paint: string) => {
        let result = paintVisibility.get(paint);
        if (result === undefined) {
            // Paint-server references remain eligible; only solid colors have a color alpha.
            result = paint !== 'none' && (parseColor(paint)?.opacity ?? 1) > 0;
            paintVisibility.set(paint, result);
        }
        return result;
    };
    const getStyle = (element: Element) => {
        let style = styles.get(element);
        if (!style) {
            style = window.getComputedStyle(element);
            styles.set(element, style);
        }
        return style;
    };
    const isPainted = (element: Element): boolean => {
        const cached = visible.get(element);
        if (cached !== undefined) return cached;
        const style = getStyle(element);
        const result =
            style.display !== 'none' &&
            Number(style.opacity || 1) > 0 &&
            (!element.parentElement || element === svg || isPainted(element.parentElement));
        visible.set(element, result);
        return result;
    };
    const isClipped = (element: SVGGraphicsElement): boolean => {
        // Built-in plugins use local, userSpaceOnUse rectangular clips. Resolve them in
        // the clipped ancestor's coordinate system, including nested transforms.
        for (
            let ancestor: Element | null = element;
            ancestor && ancestor !== svg;
            ancestor = ancestor.parentElement
        ) {
            const clip = getStyle(ancestor).clipPath;
            if (!clip || clip === 'none') continue;
            const id = clip.match(/#([^"')]+)["']?\)$/)?.[1];
            const path = id ? svg.ownerDocument.getElementById(id) : null;
            if (!path || !(ancestor instanceof SVGGraphicsElement)) continue;
            const point = toLocal(position, ancestor);
            if (!point) return true;
            const rectangles = Array.from(path.querySelectorAll('rect'));
            if (
                rectangles.length &&
                !rectangles.some((rect) => {
                    const x = rect.x.baseVal.value;
                    const y = rect.y.baseVal.value;
                    return (
                        point.x >= x &&
                        point.x <= x + rect.width.baseVal.value &&
                        point.y >= y &&
                        point.y <= y + rect.height.baseVal.value
                    );
                })
            )
                return true;
        }
        return false;
    };
    const hits: InteractionElement[] = [];
    for (const {element, item} of elements) {
        if (!isPainted(element)) continue;
        const style = getStyle(element);
        if (style.visibility === 'hidden' || style.visibility === 'collapse') continue;
        const point = toLocal(position, element);
        if (!point) continue;
        const fill = hasVisiblePaint(style.fill) && Number(style.fillOpacity || 1) > 0;
        const stroke =
            hasVisiblePaint(style.stroke) &&
            Number(style.strokeOpacity || 1) > 0 &&
            parseFloat(style.strokeWidth) > 0;
        if (!((fill && element.isPointInFill(point)) || (stroke && element.isPointInStroke(point))))
            continue;
        if (isClipped(element)) continue;
        hits.push({element, item});
    }
    hits.sort((a, b) => {
        if (a.element === b.element) return 0;
        // compareDocumentPosition returns a DOM bit mask.
        // eslint-disable-next-line no-bitwise
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING
            ? 1
            : -1;
    });
    const seen = new Map<string, Set<ChartInteractionItem['point']>>();
    return hits.flatMap(({item}) => {
        let points = seen.get(item.series.id);
        if (!points) {
            points = new Set();
            seen.set(item.series.id, points);
        }
        if (points.has(item.point)) return [];
        points.add(item.point);
        return [item];
    });
}
