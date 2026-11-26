import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';
import {isInsidePath} from '~core/utils/tooltip-helpers';

import type {PreparedSankeyData, SankeyTooltipChunk} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedSankeyData>,
): GetTooltipDataResult<SankeyTooltipChunk> {
    const {data, position, boundsWidth, boundsHeight} = args;
    const [pointerX, pointerY] = position;

    const [sankeyData] = data;
    if (!sankeyData) {
        return {chunks: []};
    }

    const closestLink = sankeyData.links.find((d) =>
        isInsidePath({
            path: d.path ?? '',
            strokeWidth: d.strokeWidth,
            point: [pointerX, pointerY],
            width: boundsWidth,
            height: boundsHeight,
        }),
    );

    if (!closestLink) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestLink.source,
                target: closestLink.target,
                value: closestLink.value,
                series: sankeyData.series,
                closest: true,
                // The chunk is found only when the pointer is inside the shape.
                distance: 0,
            },
        ],
    };
}
