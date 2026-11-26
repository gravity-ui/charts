import {getDistanceToRect} from '~core/utils/geometry';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';
import {getClosestPointsByXValue} from '~core/utils/tooltip-helpers';

import type {PreparedWaterfallData, WaterfallTooltipChunk} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedWaterfallData>,
): GetTooltipDataResult<WaterfallTooltipChunk> {
    const {data, position, measureDistance} = args;
    const [pointerX, pointerY] = position;

    const points = data.map((d) => ({
        data: d.data,
        distance: measureDistance ? getDistanceToRect({point: position, ...d}) : undefined,
        series: d.series,
        x: d.x + d.width / 2,
        y0: d.y,
        y1: d.y + d.height,
        subTotal: d.subTotal,
    }));

    return {chunks: getClosestPointsByXValue(pointerX, pointerY, points)};
}
