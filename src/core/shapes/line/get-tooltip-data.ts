import type {LineSeries} from '../../../types';
import {getDistanceToSegment} from '../../utils/tooltip-helpers';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import {isDrawnPoint} from './auto-placement';
import type {PreparedLineData} from './types';

function getDistanceToLine(item: PreparedLineData, point: [number, number]) {
    const [pointerX, pointerY] = point;
    let distance = Infinity;

    for (const s of item.segments) {
        distance = Math.min(
            distance,
            getDistanceToSegment({point, start: [s.x1, s.y1], end: [s.x2, s.y2]}) - s.halfWidth,
        );
    }

    // A point without drawn neighbours draws no segment.
    const {points} = item;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const prev = points[i - 1];
        const next = points[i + 1];
        if (isDrawnPoint(p) && !(prev && isDrawnPoint(prev)) && !(next && isDrawnPoint(next))) {
            distance = Math.min(distance, Math.hypot(pointerX - p.x, pointerY - p.y));
        }
    }

    return Math.min(Math.max(0, distance), getDistanceToMarkers(item.markers, point));
}

export function getTooltipData(args: GetTooltipDataArgs<PreparedLineData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        const distance = measureDistance ? getDistanceToLine(d, position) : 0;
        for (const p of d.points) {
            if (p.y !== null && p.x !== null && !p.hiddenInLine) {
                acc.push({
                    color: getMarkerFill(p, p.series.color),
                    data: p.data,
                    distance,
                    series: p.series as LineSeries,
                    x: p.x,
                    y0: p.y,
                    y1: p.y,
                });
            }
        }
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
