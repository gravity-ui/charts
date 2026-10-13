import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import type {PreparedAreaRangeData} from '~core/shapes/area-range/types';
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

import type {AreaRangeSeriesData} from '../../types';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedAreaRangeData[];
    const seriesById = new Map(shapes.map((shape) => [shape.series.id, shape.series]));
    return [
        ...getInteractionElements<PreparedAreaRangeData>(
            plot,
            '.gcharts-area-range__line, .gcharts-area-range__region',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getInteractionElements<MarkerItem>(markers, '.gcharts-marker__symbol', (marker) => {
            const series = seriesById.get(marker.series.id);
            return series && !marker.clipped
                ? {point: marker.data as AreaRangeSeriesData, series}
                : undefined;
        }),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaRangeData>,
): NearestCandidate[] {
    return getPointCandidates(getTooltipData(args).xLookupPoints ?? []);
}
