import {getTooltipData} from '~core/shapes/line/get-tooltip-data';
import type {PreparedLineData} from '~core/shapes/line/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedLineData[];
    return [
        ...getInteractionElements<PreparedLineData>(plot, ':scope > path', (shape) => ({
            point: getShapePoint(shape, shape.points),
            series: shape.series,
        })),
        ...getMarkerInteractionElements(markers, shapes),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedLineData>,
): NearestCandidate[] {
    return getPointCandidates(getTooltipData(args).xLookupPoints ?? []);
}
