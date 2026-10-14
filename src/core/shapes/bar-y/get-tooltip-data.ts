import {bisector, sort} from 'd3-array';

import type {BarYSeries} from '../../../types';
import {getDistanceToRoundedRect} from '../../utils/geometry';
import {isPointTooltipEnabled} from '../../utils/tooltip-helpers';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    TooltipCandidate,
} from '../../utils/tooltip-helpers';

import type {PreparedBarYData} from './types';
import {getBarYContour} from './utils';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarYData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;
    const [pointerX, pointerY] = position;

    const visibleData = data.filter((p) => isPointTooltipEnabled({data: p.data, series: p.series}));

    const sorted = sort(visibleData, (p) => p.y);
    const closestYIndex = bisector<PreparedBarYData, number>((p) => p.y + p.height / 2).center(
        sorted,
        pointerY,
    );

    const closestYPoint = sorted[closestYIndex];

    if (!closestYPoint) {
        return {chunks: []};
    }

    const selectedPoints = visibleData.filter((p) => p.data.y === closestYPoint.data.y);

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
        chunks: selectedPoints.map<TooltipCandidate>((p) => {
            const closest = p.x === closestPointXValue && p.y === closestYPoint.y;
            return {
                data: p.data,
                percentage: p.percentage,
                series: p.series as BarYSeries,
                closest,
                distance:
                    closest && measureDistance
                        ? getDistanceToRoundedRect({point: position, ...getBarYContour(p)})
                        : undefined,
            };
        }),
    };
}
