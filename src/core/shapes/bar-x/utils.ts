import type {CornerRadii} from '../../utils/geometry';
import {getRectPath} from '../utils';

import type {PreparedBarXData} from './types';

/** The painted contour of a bar segment: the value end padding and the rounded stack end. */
export function getBarXContour(d: PreparedBarXData) {
    const y = d.y - (d.extendsUp ? d.valueEndPadding : 0);
    const height = d.height + d.valueEndPadding;
    const radius = d.isStackEnd ? Math.min(height, d.width / 2, d.series.borderRadius) : 0;
    const borderRadius: CornerRadii = d.extendsUp ? [radius, radius, 0, 0] : [0, 0, radius, radius];

    return {x: d.x, y, width: d.width, height, radius, borderRadius};
}

export function getBarXPaths(d: PreparedBarXData) {
    const {y, height, radius, borderRadius} = getBarXContour(d);
    const outer = getRectPath({
        x: d.x,
        y,
        width: d.width,
        height,
        borderRadius,
    }).toString();

    if (!d.borderWidth || d.height <= 2 * d.borderWidth) {
        return {fill: outer, border: ''};
    }

    const width = d.width - 2 * d.borderWidth;
    const innerHeight = height - 2 * d.borderWidth;
    const innerRadius = Math.min(Math.max(radius - d.borderWidth, 0), innerHeight);
    const inner = getRectPath({
        x: d.x + d.borderWidth,
        y: y + d.borderWidth,
        width,
        height: innerHeight,
        borderRadius: d.extendsUp
            ? [innerRadius, innerRadius, 0, 0]
            : [0, 0, innerRadius, innerRadius],
    }).toString();

    // The border stays inside the outer contour. A centered border path would
    // expand its bounds and reduce the visible gaps between stacked segments.
    return {fill: inner, border: `${outer} ${inner}`};
}
