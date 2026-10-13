import {getTooltipData} from '~core/shapes/line/get-tooltip-data';
import type {PreparedLineData} from '~core/shapes/line/types';
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

import type {LineSeriesData} from '../../types';

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedLineData[];
    const seriesById = new Map(shapes.map((shape) => [shape.series.id, shape.series]));
    return [
        ...getInteractionElements<PreparedLineData>(plot, ':scope > path', (shape) => ({
            point: getShapePoint(shape, shape.points),
            series: shape.series,
        })),
        ...getInteractionElements<MarkerItem>(markers, '.gcharts-marker__symbol', (marker) => {
            const series = seriesById.get(marker.series.id);
            return series && !marker.clipped
                ? {point: marker.data as LineSeriesData, series}
                : undefined;
        }),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedLineData>,
): NearestCandidate[] {
    return getPointCandidates(getTooltipData(args).xLookupPoints ?? []);
}
