import type {PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import {getGradientBBox} from '../../utils/gradient';

import type {AreaRangePointData} from './types';

export function getRangeBBox(points: AreaRangePointData[]) {
    return getGradientBBox(
        points.flatMap((point) =>
            point.y0 === null || point.y1 === null || point.hiddenInLine
                ? []
                : [
                      {x: point.x, y: point.y0},
                      {x: point.x, y: point.y1},
                  ],
        ),
    );
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
