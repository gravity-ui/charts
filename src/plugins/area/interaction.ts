import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedAreaData[];
    return [
        ...getInteractionElements<PreparedAreaData>(
            plot,
            '.gcharts-area__line, .gcharts-area__region',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements(markers, shapes),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaData>,
): NearestCandidate[] {
    return getPointCandidates(
        getTooltipData({...args, measureDistance: false}).xLookupPoints ?? [],
    );
}
