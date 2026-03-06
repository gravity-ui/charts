import {symbolCircle, symbolDiamond2, symbolSquare, symbolTriangle2} from 'd3';

import {SymbolType} from '../../constants';

export const getSymbolType = (index: number) => {
    const scatterStyles = Object.values(SymbolType);

    return scatterStyles[index % scatterStyles.length];
};

// This is an inverted triangle
// Based on https://github.com/d3/d3-shape/blob/main/src/symbol/triangle2.js
const sqrt3 = Math.sqrt(3);
const triangleDown = {
    draw: (context: CanvasPath, size: number) => {
        const s = Math.sqrt(size) * 0.6824;
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

export function getSymbolBBoxWidth({
    symbolSize,
    symbolType,
}: {
    symbolSize: number;
    symbolType: `${SymbolType}`;
}) {
    switch (symbolType) {
        case SymbolType.Diamond:
            return Math.sqrt(symbolSize * 2);
        case SymbolType.Circle:
            return Math.sqrt(symbolSize / Math.PI) * 2;
        case SymbolType.Square:
            return Math.sqrt(symbolSize);
        case SymbolType.Triangle:
        case SymbolType.TriangleDown:
            return Math.sqrt((4 * symbolSize * Math.sqrt(3)) / 3);
        default:
            return 0;
    }
}
