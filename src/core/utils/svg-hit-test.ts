import {color as parseColor} from 'd3-color';

import type {PointPosition} from '../../types';

function toLocal(position: PointPosition, element: SVGGraphicsElement): DOMPoint | null {
    const matrix = element.getScreenCTM();
    if (!matrix || matrix.a * matrix.d === matrix.b * matrix.c) return null;
    return new DOMPoint(...position).matrixTransform(matrix.inverse());
}

/** Reuses computed styles while testing a click against SVG paint geometry. */
export function createSvgHitTest(svg: SVGSVGElement, position: PointPosition) {
    const styles = new Map<Element, CSSStyleDeclaration>();
    const visible = new Map<Element, boolean>();
    const clipped = new Map<Element, boolean>();
    const localPositions = new Map<SVGGraphicsElement, DOMPoint | null>();
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
    const getLocalPosition = (element: SVGGraphicsElement) => {
        if (!localPositions.has(element)) {
            localPositions.set(element, toLocal(position, element));
        }
        return localPositions.get(element) ?? null;
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
    const isClipped = (element: Element): boolean => {
        if (element === svg) return false;
        const cached = clipped.get(element);
        if (cached !== undefined) return cached;
        // Built-in plugins use local, userSpaceOnUse rectangular clips. Resolve them in
        // the clipped ancestor's coordinate system, including nested transforms.
        const clip = getStyle(element).clipPath;
        const id = clip?.match(/#([^"')]+)["']?\)$/)?.[1];
        const path = id ? svg.ownerDocument.getElementById(id) : null;
        let result = false;
        if (path && element instanceof SVGGraphicsElement) {
            const point = getLocalPosition(element);
            const rectangles = Array.from(path.querySelectorAll('rect'));
            result =
                !point ||
                (rectangles.length > 0 &&
                    !rectangles.some((rect) => {
                        const x = rect.x.baseVal.value;
                        const y = rect.y.baseVal.value;
                        return (
                            point.x >= x &&
                            point.x <= x + rect.width.baseVal.value &&
                            point.y >= y &&
                            point.y <= y + rect.height.baseVal.value
                        );
                    }));
        }
        result ||= Boolean(element.parentElement && isClipped(element.parentElement));
        clipped.set(element, result);
        return result;
    };
    return (element: SVGGeometryElement): boolean => {
        if (!isPainted(element)) return false;
        const style = getStyle(element);
        if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
        const point = getLocalPosition(element);
        if (!point) return false;
        const fill = hasVisiblePaint(style.fill) && Number(style.fillOpacity || 1) > 0;
        const stroke =
            hasVisiblePaint(style.stroke) &&
            Number(style.strokeOpacity || 1) > 0 &&
            parseFloat(style.strokeWidth) > 0;
        if (!((fill && element.isPointInFill(point)) || (stroke && element.isPointInStroke(point))))
            return false;
        if (isClipped(element)) return false;
        return true;
    };
}
