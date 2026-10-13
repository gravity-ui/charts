import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import type {PreparedAreaData} from '~core/shapes/area/types';
import type {MarkerItem} from '~core/shapes/types';
import {
    getInteractionElements,
    getPointCandidates,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {
    InteractionElementsArgs,
    NearestCandidate,
    PrepareNearestDataArgs,
} from '~core/utils/chart-interaction';

import type {AreaSeriesData} from '../../types';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedAreaData[];
    const seriesById = new Map(shapes.map((shape) => [shape.series.id, shape.series]));
    return [
        ...getInteractionElements<PreparedAreaData>(
            plot,
            '.gcharts-area__line, .gcharts-area__region',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getInteractionElements<MarkerItem>(markers, '.gcharts-marker__symbol', (marker) => {
            const series = seriesById.get(marker.series.id);
            return series && !marker.clipped
                ? {point: marker.data as AreaSeriesData, series}
                : undefined;
        }),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaData>,
): NearestCandidate[] {
    return getPointCandidates(getTooltipData(args).xLookupPoints ?? []);
}
