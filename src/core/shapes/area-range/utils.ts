import type {PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {GradientBBox} from '../../utils/gradient';

import type {AreaRangePointData} from './types';

export function getRangeBBox(points: AreaRangePointData[]) {
    let bbox: GradientBBox | null = null;
    for (const point of points) {
        if (point.y0 === null || point.y1 === null || point.hiddenInLine) {
            continue;
        }
        const yMin = Math.min(point.y0, point.y1);
        const yMax = Math.max(point.y0, point.y1);
        if (bbox) {
            bbox.xMin = Math.min(bbox.xMin, point.x);
            bbox.xMax = Math.max(bbox.xMax, point.x);
            bbox.yMin = Math.min(bbox.yMin, yMin);
            bbox.yMax = Math.max(bbox.yMax, yMax);
        } else {
            bbox = {xMin: point.x, xMax: point.x, yMin, yMax};
        }
    }
    return bbox;
}

export function markHiddenRangePoints(args: {
    points: AreaRangePointData[];
    yScale: ChartScale;
    yAxis: PreparedYAxis;
    yAxisTop: number;
}) {
    const {points, yScale, yAxis, yAxisTop} = args;
    const minPx = yAxisTop + Math.min(...yScale.range());
    const maxPx = yAxisTop + Math.max(...yScale.range());
    const sides = points.map((point) => {
        if (
            point.y0 === null ||
            point.y1 === null ||
            point.data.y0 === null ||
            point.data.y1 === null
        ) {
            return null;
        }
        if (typeof yAxis.min === 'number' && point.data.y1 < yAxis.min) {
            return -1;
        }
        if (typeof yAxis.max === 'number' && point.data.y0 > yAxis.max) {
            return 1;
        }
        if (Math.max(point.y0, point.y1) < minPx - 0.5) {
            return 1;
        }
        if (Math.min(point.y0, point.y1) > maxPx + 0.5) {
            return -1;
        }
        return 0;
    });

    points.forEach((point, index) => {
        const side = sides[index];
        point.hiddenInTooltip = side !== 0;
        point.hiddenInLine =
            side !== 0 &&
            ![sides[index - 1], sides[index + 1]].some(
                (neighbor) => neighbor === 0 || (side !== null && neighbor === -side),
            );
    });
}
