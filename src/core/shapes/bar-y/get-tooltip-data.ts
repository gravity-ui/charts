import {bisector, sort} from 'd3-array';

import type {TooltipDataChunk} from '../../../types';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedBarYData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarYData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const visible = data.filter((p) => !p.excluded);
    const sorted = sort(visible, (p) => p.y);
    const closestYIndex = bisector<PreparedBarYData, number>((p) => p.y + p.height / 2).center(
        sorted,
        pointerY,
    );

    const closestYPoint = sorted[closestYIndex];

    if (!closestYPoint) {
        return {chunks: []};
    }

    const selectedPoints = visible.filter((p) => p.data.y === closestYPoint.data.y);

    const closestPoints = sort(
        selectedPoints.filter((p) => p.y === closestYPoint.y),
        (p) => p.x,
    );

    let closestPointXValue: number | undefined;
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

    return {
        chunks: selectedPoints.map((p) => ({
            data: p.data,
            series: p.series,
            closest: p.x === closestPointXValue && p.y === closestYPoint.y,
        })) as TooltipDataChunk[],
    };
}
