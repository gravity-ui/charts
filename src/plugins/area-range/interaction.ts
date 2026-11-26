import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import {getTooltipData} from './get-tooltip-data';
import type {AreaRangeInteractionItem} from './interaction-types';
import type {PreparedAreaRangeData} from './types';

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
