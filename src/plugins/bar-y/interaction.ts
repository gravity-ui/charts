import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {BarYInteractionItem} from './interaction-types';
import type {BarYShapesArgs, PreparedBarYData} from './types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs<BarYShapesArgs>): InteractionElement<BarYInteractionItem>[] {
    return getInteractionElements<PreparedBarYData, BarYInteractionItem>(
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
}: PrepareNearestDataArgs<PreparedBarYData>): NearestCandidate<BarYInteractionItem>[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
