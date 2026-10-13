import type {PreparedXRangeData} from '~core/shapes/x-range/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {
    InteractionElementsArgs,
    NearestCandidate,
    PrepareNearestDataArgs,
} from '~core/utils/chart-interaction';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<PreparedXRangeData>(
        plot,
        '.gcharts-x-range__segment, .gcharts-x-range__segment-border',
        (datum) => ({
            point: datum.data,
            series: datum.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedXRangeData>): NearestCandidate[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
