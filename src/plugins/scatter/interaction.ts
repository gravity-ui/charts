import type {MarkerData} from '~core/shapes/scatter/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {ScatterInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs): InteractionElement<ScatterInteractionItem>[] {
    return getInteractionElements<MarkerData, ScatterInteractionItem>(
        plot,
        '.gcharts-marker__symbol',
        (datum) => ({
            point: datum.point.data,
            series: datum.point.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<MarkerData>): NearestCandidate<ScatterInteractionItem>[] {
    return data
        .filter((shape) => !shape.clipped)
        .map(({point}) => ({
            position: [point.x, point.y],
            item: {point: point.data, series: point.series},
        }));
}
