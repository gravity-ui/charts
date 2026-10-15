import {color as parseColor} from 'd3-color';

import type {PointPosition} from '../../types';

import {getGradientT} from './gradient';

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
    const colorOpacity = new Map<string, number>();
    const paintTests = new Map<string, (point: DOMPoint) => boolean>();
    let colorContext: CanvasRenderingContext2D | null | undefined;
    const getStyle = (element: Element) => {
        let style = styles.get(element);
        if (!style) {
            style = window.getComputedStyle(element);
            styles.set(element, style);
        }
        return style;
    };
    const getColorOpacity = (color: string) => {
        let opacity = colorOpacity.get(color);
        if (opacity === undefined) {
            opacity = color === 'none' ? 0 : parseColor(color)?.opacity;
            if (opacity === undefined) {
                // Let the browser interpret newer CSS color spaces unsupported by d3-color.
                if (colorContext === undefined) {
                    const canvas = svg.ownerDocument.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    colorContext = canvas.getContext('2d', {willReadFrequently: true});
                }
                if (colorContext) {
                    colorContext.clearRect(0, 0, 1, 1);
                    colorContext.fillStyle = '#000';
                    colorContext.fillStyle = color;
                    colorContext.fillRect(0, 0, 1, 1);
                    opacity = colorContext.getImageData(0, 0, 1, 1).data[3] / 255;
                }
            }
            opacity ??= 1;
            colorOpacity.set(color, opacity);
        }
        return opacity;
    };
    const hasVisiblePaint = (paint: string, point: DOMPoint) => {
        let test = paintTests.get(paint);
        if (!test) {
            const id = paint.match(/#([^"')]+)["']?\)$/)?.[1];
            const gradient = id ? svg.ownerDocument.getElementById(id) : null;
            if (
                gradient instanceof SVGLinearGradientElement &&
                gradient.getAttribute('gradientUnits') === 'userSpaceOnUse' &&
                !gradient.hasAttribute('gradientTransform')
            ) {
                // Built-in gradients use local user-space coordinates and pad their end stops.
                let offset = 0;
                const stops = Array.from(gradient.querySelectorAll('stop'), (stop) => {
                    offset = Math.max(offset, Math.min(1, stop.offset.baseVal));
                    const style = getStyle(stop);
                    return {
                        offset,
                        opacity: getColorOpacity(style.stopColor) * Number(style.stopOpacity),
                    };
                });
                const coords = {
                    x1: gradient.x1.baseVal.value,
                    y1: gradient.y1.baseVal.value,
                    x2: gradient.x2.baseVal.value,
                    y2: gradient.y2.baseVal.value,
                };
                test = ({x, y}) => {
                    if (!stops.length) return false;
                    const t = getGradientT(x, y, coords);
                    const next = stops.findIndex((stop) => stop.offset > t);
                    if (next === 0) return stops[0].opacity > 0;
                    if (next === -1) return stops[stops.length - 1].opacity > 0;
                    const before = stops[next - 1];
                    const after = stops[next];
                    const ratio = (t - before.offset) / (after.offset - before.offset);
                    return before.opacity * (1 - ratio) + after.opacity * ratio > 0;
                };
            } else {
                const visiblePaint = id ? true : getColorOpacity(paint) > 0;
                test = () => visiblePaint;
            }
            paintTests.set(paint, test);
        }
        return test(point);
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
        const point = getLocalPosition(element);
        if (!point) return false;
        // Most elements are far from the click. Check geometry before resolving their paint.
        const inFill = element.isPointInFill(point);
        const inStroke = element.isPointInStroke(point);
        if (!inFill && !inStroke) return false;
        if (!isPainted(element)) return false;
        const style = getStyle(element);
        if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
        const fill =
            inFill && hasVisiblePaint(style.fill, point) && Number(style.fillOpacity || 1) > 0;
        const stroke =
            inStroke &&
            hasVisiblePaint(style.stroke, point) &&
            Number(style.strokeOpacity || 1) > 0 &&
            parseFloat(style.strokeWidth) > 0;
        if (!fill && !stroke) return false;
        if (isClipped(element)) return false;
        return true;
    };
}
