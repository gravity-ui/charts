import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';

import type {HeatmapTooltipChunk, PreparedHeatmapData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedHeatmapData>,
): GetTooltipDataResult<HeatmapTooltipChunk> {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const closestPoint = data[0]?.items.find(
        (cell) =>
            pointerX >= cell.x &&
            pointerX <= cell.x + cell.width &&
            pointerY >= cell.y &&
            pointerY <= cell.y + cell.height,
    );

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data,
                series: data[0].series,
                closest: true,
                // The chunk is found only when the pointer is inside the shape.
                distance: 0,
            },
        ],
    };
}
