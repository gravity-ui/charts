import {sort} from 'd3-array';

import type {XRangeSeries} from '../../../types';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedXRangeData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedXRangeData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const pointsInRange = data.filter(
        (d) =>
            pointerX >= d.x &&
            pointerX <= d.x + d.width &&
            pointerY >= d.y &&
            pointerY <= d.y + d.height,
    );

    if (pointsInRange.length === 0) {
        return {chunks: []};
    }

    const closestByX =
        pointsInRange.length === 1
            ? pointsInRange[0]
            : sort(pointsInRange, (d) => Math.abs(d.x + d.width / 2 - pointerX))[0];

    return {
        chunks: pointsInRange.map((d) => ({
            data: d.data,
            series: d.series as unknown as XRangeSeries,
            closest: d === closestByX,
        })),
    };
}
