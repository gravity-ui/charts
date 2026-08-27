import {color as parseColor} from 'd3-color';
import {interpolateRgb} from 'd3-interpolate';
import {select} from 'd3-selection';

import type {GradientStop, LinearGradient} from '~core/types';

import {getUniqId} from './misc';

const DEFAULT_GRADIENT_ANGLE = 180;
const TRIGONOMETRIC_EPSILON = Number.EPSILON;

export interface GradientBBox {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface GradientCoords {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface GradientPoint {
    hiddenInLine?: boolean;
    x: number | null;
    y: number | null;
}

interface GradientFillPoint extends GradientPoint {
    color?: string;
    fill?: string;
}

export interface GradientPaintOptions {
    bbox: GradientBBox | null;
    fallbackColor: string;
    gradient?: LinearGradient;
    id: string;
}

/** Returns the bounding box of points that participate in a rendered path. */
export function getGradientBBox(points: GradientPoint[]): GradientBBox | null {
    return points.reduce<GradientBBox | null>((bbox, point) => {
        if (point.x === null || point.y === null || point.hiddenInLine) {
            return bbox;
        }
        if (!bbox) {
            return {xMin: point.x, xMax: point.x, yMin: point.y, yMax: point.y};
        }
        return {
            xMin: Math.min(bbox.xMin, point.x),
            xMax: Math.max(bbox.xMax, point.x),
            yMin: Math.min(bbox.yMin, point.y),
            yMax: Math.max(bbox.yMax, point.y),
        };
    }, null);
}

/**
 * Converts a CSS gradient angle (0=bottom-to-top, 90=left-to-right) and a
 * bounding box to SVG linearGradient x1/y1/x2/y2 for gradientUnits="userSpaceOnUse".
 * The gradient line is sized to cover the full bounding box in the given direction.
 */
export function gradientAngleToCoords(angle: number, bbox: GradientBBox): GradientCoords {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const rad = (normalizedAngle * Math.PI) / 180;
    const rawSin = Math.sin(rad);
    const rawCos = Math.cos(rad);
    const sin = Math.abs(rawSin) < TRIGONOMETRIC_EPSILON ? 0 : rawSin;
    const cos = Math.abs(rawCos) < TRIGONOMETRIC_EPSILON ? 0 : rawCos;

    const cx = (bbox.xMin + bbox.xMax) / 2;
    const cy = (bbox.yMin + bbox.yMax) / 2;
    const hw = (bbox.xMax - bbox.xMin) / 2;
    const hh = (bbox.yMax - bbox.yMin) / 2;
    const hl = Math.abs(hw * sin) + Math.abs(hh * cos);

    return {
        x1: cx - sin * hl,
        y1: cy + cos * hl,
        x2: cx + sin * hl,
        y2: cy - cos * hl,
    };
}

function getGradientT(px: number, py: number, coords: GradientCoords): number {
    const dx = coords.x2 - coords.x1;
    const dy = coords.y2 - coords.y1;
    const len2 = dx * dx + dy * dy;

    if (len2 === 0) {
        // SVG renders a degenerate linear gradient using the last stop color.
        return 1;
    }

    return Math.max(0, Math.min(1, ((px - coords.x1) * dx + (py - coords.y1) * dy) / len2));
}

function interpolateGradientColor(t: number, sortedStops: GradientStop[]): string {
    if (t < sortedStops[0].offset) {
        return sortedStops[0].color;
    }

    let loIndex = -1;
    for (let i = 0; i < sortedStops.length; i++) {
        if (sortedStops[i].offset > t) {
            break;
        }
        loIndex = i;
    }

    if (loIndex === sortedStops.length - 1 || sortedStops[loIndex].offset === t) {
        return sortedStops[loIndex].color;
    }

    const lo = sortedStops[loIndex];
    const hi = sortedStops[loIndex + 1];
    return interpolateRgb(lo.color, hi.color)((t - lo.offset) / (hi.offset - lo.offset));
}

function sortGradientStops(stops: GradientStop[]): GradientStop[] {
    return [...stops].sort((a, b) => a.offset - b.offset);
}

/** Checks whether a value is a linear-gradient config. */
export function isLinearGradient(color: unknown): color is LinearGradient {
    return (
        typeof color === 'object' &&
        color !== null &&
        !Array.isArray(color) &&
        'type' in color &&
        color.type === 'linear-gradient'
    );
}

/** Returns the color at the middle (t = 0.5) of the gradient. */
export function getGradientMidColor(gradient: LinearGradient): string {
    return interpolateGradientColor(0.5, sortGradientStops(gradient.stops));
}

/** Returns a copy of the gradient with every valid stop color brightened. */
export function getBrighterGradient(gradient: LinearGradient, brightness?: number): LinearGradient {
    return {
        ...gradient,
        stops: gradient.stops.map((stop) => ({
            ...stop,
            color: parseColor(stop.color)?.brighter(brightness).toString() ?? stop.color,
        })),
    };
}

/** Returns the solid color for a point at pixel position (px, py) based on the gradient. */
export function getGradientColorAtPoint(
    px: number,
    py: number,
    gradient: LinearGradient,
    bbox: GradientBBox,
): string {
    return createGradientColorResolver(gradient, bbox)(px, py);
}

/** Creates a point color resolver with precomputed coordinates and sorted stops. */
export function createGradientColorResolver(
    gradient: LinearGradient,
    bbox: GradientBBox,
): (px: number, py: number) => string {
    const coords = gradientAngleToCoords(gradient.angle ?? DEFAULT_GRADIENT_ANGLE, bbox);
    const sortedStops = sortGradientStops(gradient.stops);

    return (px, py) => {
        const t = getGradientT(px, py, coords);
        return interpolateGradientColor(t, sortedStops);
    };
}

/** Resolves gradient fills for points without an explicit color. */
export function setGradientPointFills(
    points: GradientFillPoint[],
    gradient?: LinearGradient,
): void {
    if (!gradient) {
        return;
    }

    const bbox = getGradientBBox(points);
    if (!bbox) {
        return;
    }

    const getGradientColor = createGradientColorResolver(gradient, bbox);
    for (const point of points) {
        if (point.color === undefined && point.x !== null && point.y !== null) {
            point.fill = getGradientColor(point.x, point.y);
        }
    }
}

function getUniqueGradientId(container: SVGGElement, preferredId: string): string {
    const document = container.ownerDocument;
    let id = preferredId;

    while (document.getElementById(id)) {
        id = `${preferredId}-${getUniqId()}`;
    }

    return id;
}

/**
 * Creates a <linearGradient> def in the container's <defs> and returns its id.
 * Uses gradientUnits="userSpaceOnUse" with coordinates derived from the bbox and angle.
 */
function createGradientDef(
    container: SVGGElement,
    gradient: LinearGradient,
    bbox: GradientBBox,
    preferredId: string,
): string {
    if (!container.ownerSVGElement) {
        return '';
    }
    const containerSelection = select(container);
    let defs = containerSelection.select<SVGDefsElement>('defs.gradients');
    if (defs.empty()) {
        defs = containerSelection.append('defs').attr('class', 'gradients');
    }
    const id = getUniqueGradientId(container, preferredId);
    const coords = gradientAngleToCoords(gradient.angle ?? DEFAULT_GRADIENT_ANGLE, bbox);
    const grad = defs
        .append('linearGradient')
        .attr('id', id)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', coords.x1)
        .attr('y1', coords.y1)
        .attr('x2', coords.x2)
        .attr('y2', coords.y2);
    for (const stop of gradient.stops) {
        grad.append('stop').attr('offset', stop.offset).attr('stop-color', stop.color);
    }
    return id;
}

/** Creates a per-render resolver that reuses gradient definitions by paint id. */
export function createGradientPaintResolver(container: SVGGElement) {
    const ids = new Map<string, string>();

    return ({bbox, fallbackColor, gradient, id: preferredId}: GradientPaintOptions): string => {
        if (!gradient || !bbox) {
            return fallbackColor;
        }

        let id = ids.get(preferredId);
        if (!id) {
            id = createGradientDef(container, gradient, bbox, preferredId);
            if (id) {
                ids.set(preferredId, id);
            }
        }

        return id ? `url(#${id})` : fallbackColor;
    };
}
