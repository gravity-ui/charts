import {getTooltipData} from '~core/shapes/line/get-tooltip-data';
import type {PreparedLineData} from '~core/shapes/line/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import type {LineInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
    markers,
    preparedData,
}: InteractionElementsArgs): InteractionElement<LineInteractionItem>[] {
    const shapes = preparedData as PreparedLineData[];
    return [
        ...getInteractionElements<PreparedLineData, LineInteractionItem>(
            plot,
            ':scope > path',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements<LineInteractionItem>(markers, shapes),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedLineData>,
): NearestCandidate<LineInteractionItem>[] {
    return getPointCandidates(
        getTooltipData({...args, measureDistance: false}).xLookupPoints ?? [],
    ) as NearestCandidate<LineInteractionItem>[];
}
