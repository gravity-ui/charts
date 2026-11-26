import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';

import type {TreemapSeries} from '../../types';

import type {PreparedTreemapData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedTreemapData>,
): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const closestPoint = data[0]?.leaves.find(
        (l) => pointerX >= l.x0 && pointerX <= l.x1 && pointerY >= l.y0 && pointerY <= l.y1,
    );

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data,
                color: data[0].colors.get(closestPoint),
                series: data[0].series as unknown as TreemapSeries,
                closest: true,
                // The chunk is found only when the pointer is inside the shape.
                distance: 0,
            },
        ],
    };
}
