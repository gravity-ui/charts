import {bisector, sort} from 'd3-array';

import type {TooltipDataChunk} from '../../../types';
import {isPointTooltipEnabled} from '../../utils/tooltip-helpers';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedBarYData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarYData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const visibleData = data.filter((p) => isPointTooltipEnabled({data: p.data, series: p.series}));

    const sorted = sort(visibleData, (p) => p.y + p.height / 2);
    const closestYIndex = bisector<PreparedBarYData, number>((p) => p.y + p.height / 2).center(
        sorted,
        pointerY,
    );

    const closestYPoint = sorted[closestYIndex];

    if (!closestYPoint) {
        return {chunks: []};
    }

    const selectedPoints = visibleData.filter((p) => p.data.y === closestYPoint.data.y);

    const hasOverlays = selectedPoints.some((p) => p.series.grouping === false);
    let closestPoint: PreparedBarYData | undefined;
    let closestPointXValue: number | undefined;
    if (hasOverlays) {
        let closestDistance = Infinity;
        // selectedPoints retains paint order, so the later bar wins overlapping hits.
        for (const point of selectedPoints) {
            const distance = Math.hypot(
                Math.max(point.x - pointerX, pointerX - point.x - point.width, 0),
                Math.max(point.y - pointerY, pointerY - point.y - point.height, 0),
            );
            if (distance <= closestDistance) {
                closestPoint = point;
                closestDistance = distance;
            }
        }
    } else {
        const closestPoints = sort(
            selectedPoints.filter((p) => p.y === closestYPoint.y),
            (p) => p.x,
        );
        const lastPoint = closestPoints[closestPoints.length - 1];
        if (pointerX < closestPoints[0]?.x) {
            closestPointXValue = closestPoints[0].x;
        } else if (lastPoint && pointerX > lastPoint.x + lastPoint.width) {
            closestPointXValue = lastPoint.x;
        } else {
            closestPointXValue = closestPoints.find(
                (p) => pointerX > p.x && pointerX < p.x + p.width,
            )?.x;
        }
    }

    return {
        chunks: selectedPoints.map((p) => ({
            data: p.data,
            percentage: p.percentage,
            series: p.series,
            closest: hasOverlays
                ? p === closestPoint
                : p.x === closestPointXValue && p.y === closestYPoint.y,
        })) as TooltipDataChunk[],
    };
}
