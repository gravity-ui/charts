import {getRectPath} from '../utils';

import type {PreparedBarXData} from './types';

export function getBarXPaths(d: PreparedBarXData) {
    const radius = d.isLastStackItem ? Math.min(d.height, d.width / 2, d.series.borderRadius) : 0;
    const outer = getRectPath({
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        borderRadius: d.extendsUp ? [radius, radius, 0, 0] : [0, 0, radius, radius],
    }).toString();

    if (!d.borderWidth || d.height <= 0) {
        return {fill: outer, border: ''};
    }

    const width = d.width - 2 * d.borderWidth;
    const height = d.height - 2 * d.borderWidth;
    if (height <= 0) {
        return {fill: '', border: outer};
    }

    const innerRadius = Math.min(Math.max(radius - d.borderWidth, 0), height);
    const inner = getRectPath({
        x: d.x + d.borderWidth,
        y: d.y + d.borderWidth,
        width,
        height,
        borderRadius: d.extendsUp
            ? [innerRadius, innerRadius, 0, 0]
            : [0, 0, innerRadius, innerRadius],
    }).toString();

    // Both contours stay inside the original bar. A centered border path would
    // expand its bounds and reduce the visible gaps between stacked segments.
    return {fill: inner, border: `${outer} ${inner}`};
}
