import {getDistanceToSymbol} from '../../utils/symbol';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedScatterData} from './types';

/** Distance to the painted marker, drawn by `setMarker` with `radius + borderWidth` and stroked. */
function getDistanceToMarker(marker: PreparedScatterData, point: [number, number]) {
    const {x, y, data, series} = marker.point;
    const {symbol, radius, borderWidth} = series.marker.states.normal;
    return getDistanceToSymbol({
        point,
        center: [x, y],
        symbolType: symbol,
        radius: (data.radius ?? radius) + borderWidth,
        strokeWidth: borderWidth,
    });
}

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedScatterData>,
): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    // The nearest marker contour; among equally distant markers the one with the nearest
    // center wins, so markers of the same size are still picked by their centers.
    let closestPoint: PreparedScatterData | undefined;
    let distance = Infinity;
    let centerDistance = Infinity;
    for (const marker of data) {
        if (marker.clipped) {
            continue;
        }
        const markerDistance = getDistanceToMarker(marker, position);
        if (markerDistance > distance) {
            continue;
        }
        const markerCenterDistance = Math.hypot(
            pointerX - marker.point.x,
            pointerY - marker.point.y,
        );
        if (markerDistance < distance || markerCenterDistance < centerDistance) {
            closestPoint = marker;
            distance = markerDistance;
            centerDistance = markerCenterDistance;
        }
    }

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.point.data,
                color: closestPoint.point.color,
                displayPosition: [closestPoint.point.x, closestPoint.point.y],
                series: closestPoint.point.series,
                closest: true,
                distance: args.measureDistance ? distance : undefined,
            },
        ],
    };
}
