import type {TooltipDataChunk, WaterfallSeries, WaterfallSeriesData} from '../../../types';
import {getClosestPointsByXValue} from '../../utils/tooltip-helpers';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedWaterfallData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedWaterfallData>,
): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const points = data.map<ShapePoint>((d) => ({
        data: d.data as WaterfallSeriesData,
        series: d.series as WaterfallSeries,
        x: d.x + d.width / 2,
        y0: d.y,
        y1: d.y + d.height,
        subTotal: d.subTotal,
    }));

    const chunks = getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[];

    return {chunks};
}
