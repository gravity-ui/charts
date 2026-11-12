import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import {getTooltipData} from './get-tooltip-data';
import type {LineInteractionItem} from './interaction-types';
import type {PreparedLineData} from './types';

export function getTargetElements({
    plot,
    markers,
    preparedData,
}: InteractionElementsArgs<PreparedLineData>): InteractionElement<LineInteractionItem>[] {
    const shapes = preparedData;
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
    );
}
