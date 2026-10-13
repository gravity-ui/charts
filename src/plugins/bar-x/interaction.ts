import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {
    InteractionElementsArgs,
    NearestCandidate,
    PrepareNearestDataArgs,
} from '~core/utils/chart-interaction';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<PreparedBarXData>(
        plot,
        '.gcharts-bar-x__segment, .gcharts-bar-x__segment-border',
        (datum) => ({
            point: datum.data,
            series: datum.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedBarXData>): NearestCandidate[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
