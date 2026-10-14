import type {SymbolType} from '../constants';

import {getDistanceToPolygon} from './geometry';
import {getSymbolSize} from './symbol';

export function getDistanceToSymbol(args: {
    point: [number, number];
    center: [number, number];
    symbolType: `${SymbolType}`;
    radius: number;
    strokeWidth: number;
}) {
    const {point, center, symbolType, radius, strokeWidth} = args;
    const localPoint: [number, number] = [point[0] - center[0], point[1] - center[1]];
    const halfStroke = strokeWidth / 2;
    if (symbolType === 'circle' || radius === 0) {
        return Math.max(0, Math.hypot(...localPoint) - radius - halfStroke);
    }

    const {width, height} = getSymbolSize({symbolType, symbolSize: Math.PI * radius ** 2});
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    let vertices: [number, number][];
    switch (symbolType) {
        case 'square':
            vertices = [
                [-halfWidth, -halfHeight],
                [halfWidth, -halfHeight],
                [halfWidth, halfHeight],
                [-halfWidth, halfHeight],
            ];
            break;
        case 'diamond':
            vertices = [
                [0, -halfHeight],
                [halfWidth, 0],
                [0, halfHeight],
                [-halfWidth, 0],
            ];
            break;
        case 'triangle':
            vertices = [
                [0, -halfHeight],
                [halfWidth, halfHeight / 2],
                [-halfWidth, halfHeight / 2],
            ];
            break;
        case 'triangle-down':
            vertices = [
                [0, halfHeight],
                [-halfWidth, -halfHeight / 2],
                [halfWidth, -halfHeight / 2],
            ];
            break;
        default:
            return Math.max(0, Math.hypot(...localPoint) - radius - halfStroke);
    }

    if (halfStroke > 0) {
        const normals = vertices.map((vertex, index) => {
            const next = vertices[(index + 1) % vertices.length];
            const dx = next[0] - vertex[0];
            const dy = next[1] - vertex[1];
            const length = Math.hypot(dx, dy);
            return [dy / length, -dx / length];
        });
        vertices = vertices.map((vertex, index) => {
            const previous = normals[(index + normals.length - 1) % normals.length];
            const next = normals[index];
            const scale = halfStroke / (1 + previous[0] * next[0] + previous[1] * next[1]);
            return [
                vertex[0] + (previous[0] + next[0]) * scale,
                vertex[1] + (previous[1] + next[1]) * scale,
            ];
        });
    }

    return getDistanceToPolygon({point: localPoint, vertices});
}
