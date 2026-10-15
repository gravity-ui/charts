import type {CornerRadii} from '../../utils/geometry';

import type {PreparedXRangeData} from './types';

export function getXRangeBorderRadius(d: PreparedXRangeData) {
    return Math.min(d.height / 2, d.width / 2, d.series.borderRadius);
}

/** The painted contour of a range: the border is centered on the rect edge and extends outside it. */
export function getXRangeContour(d: PreparedXRangeData) {
    const radius = getXRangeBorderRadius(d);
    const halfBorder = d.series.borderWidth / 2;
    const outerRadius = radius ? radius + halfBorder : 0;

    return {
        x: d.x - halfBorder,
        y: d.y - halfBorder,
        width: d.width + d.series.borderWidth,
        height: d.height + d.series.borderWidth,
        borderRadius: [outerRadius, outerRadius, outerRadius, outerRadius] as CornerRadii,
    };
}
