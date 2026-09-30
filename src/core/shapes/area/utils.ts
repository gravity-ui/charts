import type {GradientBBox} from '../../utils/gradient';
import {getGradientBBox} from '../../utils/gradient';

import type {PointData} from './types';

export function getAreaBBox(
    points: PointData[],
    lineBBox = getGradientBBox(points),
): GradientBBox | null {
    if (!lineBBox) {
        return null;
    }
    const bbox = {...lineBBox};
    for (const point of points) {
        if (point.y !== null && !point.hiddenInLine) {
            bbox.yMin = Math.min(bbox.yMin, point.y0);
            bbox.yMax = Math.max(bbox.yMax, point.y0);
        }
    }
    return bbox;
}
