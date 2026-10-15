import type {LineSeries} from '../../../types';
import {getDistanceToStrokedSegment} from '../../utils/geometry';
import type {Point} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import {isDrawnPoint} from './auto-placement';
import type {PlacementSegment} from './auto-placement';
import type {PreparedLineData} from './types';

function isContinuation(segment: PlacementSegment, prev: PlacementSegment | undefined) {
    return Boolean(prev && prev.x2 === segment.x1 && prev.y2 === segment.y1);
}

/**
 * Distance to the stroked line: its segments with the configured caps at the ends of each
 * drawn run (joins are treated as round, dash gaps are ignored), isolated points and markers.
 */
function getDistanceToLine(item: PreparedLineData, point: Point) {
    const {linecap} = item;
    const segments = item.getSegments();
    let distance = Infinity;

    for (let i = 0; i < segments.length && distance > 0; i++) {
        const s = segments[i];
        const startsRun = !isContinuation(s, segments[i - 1]);
        const endsRun = !(segments[i + 1] && isContinuation(segments[i + 1], s));
        distance = Math.min(
            distance,
            getDistanceToStrokedSegment({
                point,
                start: [s.x1, s.y1],
                end: [s.x2, s.y2],
                halfWidth: s.halfWidth,
                startCap: startsRun ? linecap : 'round',
                endCap: endsRun ? linecap : 'round',
            }),
        );
    }

    // A point without drawn neighbours draws a zero-length subpath painted by its caps.
    const {points} = item;
    for (let i = 0; i < points.length && distance > 0; i++) {
        const p = points[i];
        const prev = points[i - 1];
        const next = points[i + 1];
        if (isDrawnPoint(p) && !(prev && isDrawnPoint(prev)) && !(next && isDrawnPoint(next))) {
            distance = Math.min(
                distance,
                getDistanceToStrokedSegment({
                    point,
                    start: [p.x, p.y],
                    end: [p.x, p.y],
                    halfWidth: item.lineWidth / 2,
                    startCap: linecap,
                    endCap: linecap,
                }),
            );
        }
    }

    return Math.min(distance, getDistanceToMarkers(item.markers, point));
}

export function getTooltipData(args: GetTooltipDataArgs<PreparedLineData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        const distance = measureDistance ? getDistanceToLine(d, position) : undefined;
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
