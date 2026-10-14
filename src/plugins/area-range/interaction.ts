import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import type {PreparedAreaRangeData} from '~core/shapes/area-range/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedAreaRangeData[];
    return [
        ...getInteractionElements<PreparedAreaRangeData>(
            plot,
            '.gcharts-area-range__line, .gcharts-area-range__region',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements(markers, shapes),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaRangeData>,
): NearestCandidate[] {
    return getPointCandidates(getTooltipData(args).xLookupPoints ?? []);
}
