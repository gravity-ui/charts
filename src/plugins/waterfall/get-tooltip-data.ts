import {getDistanceToRect} from '~core/utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
    TooltipCandidate,
} from '~core/utils/tooltip-helpers';
import {getClosestPointsByXValue} from '~core/utils/tooltip-helpers';

import type {WaterfallSeriesData} from '../../types';

import type {PreparedWaterfallData, WaterfallTooltipChunk} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedWaterfallData>,
): GetTooltipDataResult<WaterfallTooltipChunk> {
    const {data, position, measureDistance} = args;
    const [pointerX, pointerY] = position;

    const points = data.map<PluginShapePoint>((d) => ({
        data: d.data as WaterfallSeriesData,
        distance: measureDistance ? getDistanceToRect({point: position, ...d}) : undefined,
        series: d.series,
        x: d.x + d.width / 2,
        y0: d.y,
        y1: d.y + d.height,
        subTotal: d.subTotal,
    }));

    const chunks = getClosestPointsByXValue(
        pointerX,
        pointerY,
        points,
    ) as TooltipCandidate<WaterfallTooltipChunk>[];

    return {chunks};
}

type PluginShapePoint = ShapePoint<WaterfallTooltipChunk['data'], WaterfallTooltipChunk['series']>;
