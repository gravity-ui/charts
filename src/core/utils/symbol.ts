import {symbolCircle, symbolDiamond2, symbolSquare, symbolTriangle2} from 'd3-shape';

import {SymbolType} from '../constants';

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
            return {width: Math.sqrt(symbolSize * 2), height: size * diamondRadiusFactor * 2};
        }
        case SymbolType.Square:
            return {width: size, height: size};
        case SymbolType.Triangle:
        case SymbolType.TriangleDown: {
            const radius = size * triangleRadiusFactor;
            const width = Math.sqrt((4 * symbolSize * sqrt3) / 3);
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
