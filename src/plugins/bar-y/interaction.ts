import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<PreparedBarYData>(
        plot,
        '.gcharts-bar-y__segment, .gcharts-bar-y__segment-border',
        (datum) => ({
            point: datum.data,
            series: datum.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedBarYData>): NearestCandidate[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
