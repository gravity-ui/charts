import type {MarkerData} from '~core/shapes/scatter/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<MarkerData>(plot, '.gcharts-marker__symbol', (datum) => ({
        point: datum.point.data,
        series: datum.point.series,
    }));
}

export function prepareNearestData({data}: PrepareNearestDataArgs<MarkerData>): NearestCandidate[] {
    return data
        .filter((shape) => !shape.clipped)
        .map(({point}) => ({
            position: [point.x, point.y],
            item: {point: point.data, series: point.series},
        }));
}
