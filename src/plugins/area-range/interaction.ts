import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import type {PreparedAreaRangeData} from '~core/shapes/area-range/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import type {AreaRangeInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
    markers,
    preparedData,
}: InteractionElementsArgs): InteractionElement<AreaRangeInteractionItem>[] {
    const shapes = preparedData as PreparedAreaRangeData[];
    return [
        ...getInteractionElements<PreparedAreaRangeData, AreaRangeInteractionItem>(
            plot,
            '.gcharts-area-range__line, .gcharts-area-range__region',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements<AreaRangeInteractionItem>(markers, shapes),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaRangeData>,
): NearestCandidate<AreaRangeInteractionItem>[] {
    return getPointCandidates(
        getTooltipData({...args, measureDistance: false}).xLookupPoints ?? [],
    ) as NearestCandidate<AreaRangeInteractionItem>[];
}
