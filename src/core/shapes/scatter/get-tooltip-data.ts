import {Delaunay} from 'd3-delaunay';

import {getDistanceToSymbol} from '../../utils/symbol-geometry';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedScatterData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedScatterData>,
): GetTooltipDataResult {
    const {data, position, measureDistance} = args;
    let closestPoint: PreparedScatterData | undefined;
    let distance: number | undefined;

    if (measureDistance) {
        let closestDistance = Infinity;
        for (const marker of data) {
            if (marker.clipped) {
                continue;
            }
            const {point} = marker;
            const normal = point.series.marker.states.normal;
            const markerDistance = getDistanceToSymbol({
                point: position,
                center: [point.x, point.y],
                symbolType: normal.symbol,
                radius: (point.data.radius ?? normal.radius) + normal.borderWidth,
                strokeWidth: normal.borderWidth,
            });
            if (markerDistance < closestDistance) {
                closestDistance = markerDistance;
                closestPoint = marker;
            }
        }
        distance = closestDistance;
    } else {
        const delaunay = Delaunay.from(
            data,
            (d) => d.point.x,
            (d) => d.point.y,
        );
        closestPoint = data[delaunay.find(...position)];
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
                distance,
            },
        ],
    };
}
