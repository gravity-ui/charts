import type {WaterfallSeriesData} from '../../../types';
import {getDistanceToRect} from '../../utils/geometry';
import {getClosestPointsByXValue} from '../../utils/tooltip-helpers';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
    TooltipCandidate,
} from '../../utils/tooltip-helpers';

import type {PreparedWaterfallData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedWaterfallData>,
): GetTooltipDataResult {
    const {data, position, measureDistance} = args;
    const [pointerX, pointerY] = position;

    const points = data.map<ShapePoint>((d) => ({
        data: d.data as WaterfallSeriesData,
        distance: measureDistance ? getDistanceToRect({point: position, ...d}) : undefined,
        series: d.series,
        x: d.x + d.width / 2,
        y0: d.y,
        y1: d.y + d.height,
        subTotal: d.subTotal,
    }));

    const chunks = getClosestPointsByXValue(pointerX, pointerY, points) as TooltipCandidate[];

    return {chunks};
}
