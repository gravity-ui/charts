import {symbolCircle, symbolDiamond2, symbolSquare, symbolTriangle2} from 'd3-shape';

import {SymbolType} from '../constants';

import {getDistanceToPolygon, offsetConvexPolygon} from './geometry';
import type {Point} from './geometry';

export const getSymbolType = (index: number) => {
    const scatterStyles = Object.values(SymbolType);

    return scatterStyles[index % scatterStyles.length];
};

// Radius multipliers used by D3's symbolDiamond2 and symbolTriangle2 draw methods.
// https://github.com/d3/d3-shape/blob/v3.2.0/src/symbol/diamond2.js
const diamondRadiusFactor = 0.62625;
// https://github.com/d3/d3-shape/blob/v3.2.0/src/symbol/triangle2.js
const triangleRadiusFactor = 0.6824;
const sqrt3 = Math.sqrt(3);

// Invert D3's triangle2 around its centroid.
const triangleDown = {
    draw: (context: CanvasPath, size: number) => {
        const s = Math.sqrt(size) * triangleRadiusFactor;
        const t = s / 2;
        const u = (s * sqrt3) / 2;
        context.moveTo(0, s);
        context.lineTo(u, -t);
        context.lineTo(-u, -t);
        context.closePath();
    },
};

export const getSymbol = (symbolType: `${SymbolType}`) => {
    switch (symbolType) {
        case SymbolType.Diamond:
            return symbolDiamond2;
        case SymbolType.Circle:
            return symbolCircle;
        case SymbolType.Square:
            return symbolSquare;
        case SymbolType.Triangle:
            return symbolTriangle2;
        case SymbolType.TriangleDown:
            return triangleDown;
        default:
            return symbolCircle;
    }
};

interface SymbolSizeOptions {
    symbolSize: number;
    symbolType: `${SymbolType}`;
}

export function getSymbolSize({symbolSize, symbolType}: SymbolSizeOptions) {
    const size = Math.sqrt(symbolSize);
    switch (symbolType) {
        case SymbolType.Circle: {
            const diameter = Math.sqrt(symbolSize / Math.PI) * 2;
            return {width: diameter, height: diameter};
        }
        case SymbolType.Diamond: {
            const diameter = size * diamondRadiusFactor * 2;
            return {width: diameter, height: diameter};
        }
        case SymbolType.Square:
            return {width: size, height: size};
        case SymbolType.Triangle:
        case SymbolType.TriangleDown: {
            const radius = size * triangleRadiusFactor;
            const width = radius * sqrt3;
            // triangle2 is centered at its centroid, not at its bounding box center.
            // Reserve equal space above and below the current symbol origin.
            return {width, height: 2 * radius};
        }
        default:
            return {width: 0, height: 0};
    }
}

export function getSymbolBBoxWidth(options: SymbolSizeOptions) {
    return getSymbolSize(options).width;
}

/** Vertices of a non-circular symbol drawn around the origin, as `getSymbol` draws it. */
function getSymbolVertices(symbolType: `${SymbolType}`, symbolSize: number): Point[] {
    const size = Math.sqrt(symbolSize);
    switch (symbolType) {
        case SymbolType.Square: {
            const half = size / 2;
            return [
                [-half, -half],
                [half, -half],
                [half, half],
                [-half, half],
            ];
        }
        case SymbolType.Diamond: {
            const r = size * diamondRadiusFactor;
            return [
                [0, -r],
                [r, 0],
                [0, r],
                [-r, 0],
            ];
        }
        case SymbolType.Triangle: {
            const s = size * triangleRadiusFactor;
            return [
                [0, -s],
                [(s * sqrt3) / 2, s / 2],
                [-(s * sqrt3) / 2, s / 2],
            ];
        }
        case SymbolType.TriangleDown: {
            const s = size * triangleRadiusFactor;
            return [
                [0, s],
                [(s * sqrt3) / 2, -s / 2],
                [-(s * sqrt3) / 2, -s / 2],
            ];
        }
        default:
            return [];
    }
}

/**
 * Distance from the pointer to the painted contour of a marker symbol; `0` when the
 * pointer is inside it. `radius` is the symbol radius passed to `getMarkerSymbol`, the
 * stroke of `strokeWidth` is painted centered on the symbol outline, so the contour lies
 * `strokeWidth / 2` outside it.
 */
export function getDistanceToSymbol(args: {
    point: Point;
    center: Point;
    symbolType: `${SymbolType}`;
    radius: number;
    strokeWidth: number;
}) {
    const {point, center, symbolType, radius, strokeWidth} = args;
    const outset = strokeWidth / 2;
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];

    if (symbolType === SymbolType.Circle) {
        return Math.max(0, Math.hypot(dx, dy) - radius - outset);
    }

    const vertices = getSymbolVertices(symbolType, Math.PI * radius ** 2);
    if (vertices.length === 0) {
        return Math.max(0, Math.hypot(dx, dy) - radius - outset);
    }

    return getDistanceToPolygon({
        point: [dx, dy],
        vertices: offsetConvexPolygon(vertices, outset),
    });
}

/** Distances from the symbol origin to its painted bounds. */
export interface SymbolBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/** Bounds of the filled symbol and its stroke, including mitered corners. */
export function getSymbolBounds(args: {
    symbolType: `${SymbolType}`;
    radius: number;
    strokeWidth: number;
}): SymbolBounds {
    const {symbolType, radius, strokeWidth} = args;
    const vertices = getSymbolVertices(symbolType, Math.PI * radius ** 2);
    if (!vertices.length) {
        const extent = radius + strokeWidth / 2;
        return {left: extent, right: extent, top: extent, bottom: extent};
    }
    const contour = offsetConvexPolygon(vertices, strokeWidth / 2);
    return {
        left: -Math.min(...contour.map(([x]) => x)),
        right: Math.max(...contour.map(([x]) => x)),
        top: -Math.min(...contour.map(([, y]) => y)),
        bottom: Math.max(...contour.map(([, y]) => y)),
    };
}
