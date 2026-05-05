import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedFunnelData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedFunnelData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const closestPoint = data[0]?.items.find(
        (item) =>
            pointerX >= item.x &&
            pointerX <= item.x + item.width &&
            pointerY >= item.y &&
            pointerY <= item.y + item.height,
    );

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data,
                series: closestPoint.series,
                closest: true,
            },
        ],
    };
}
