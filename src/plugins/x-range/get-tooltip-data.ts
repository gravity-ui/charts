import {sort} from 'd3-array';

import {getDistanceToRoundedRect} from '~core/utils/geometry';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';

import type {PreparedXRangeData, XRangeTooltipChunk} from './types';
import {getXRangeContour} from './utils';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedXRangeData>,
): GetTooltipDataResult<XRangeTooltipChunk> {
    const {data, position} = args;
    const [pointerX] = position;

    // The painted contour: rounded corners and the border drawn outside the rect.
    const pointsInRange = data.filter(
        (d) => getDistanceToRoundedRect({point: position, ...getXRangeContour(d)}) === 0,
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
            series: d.series,
            closest: d === closestByX,
            // All chunks contain the pointer.
            distance: 0,
        })),
    };
}
