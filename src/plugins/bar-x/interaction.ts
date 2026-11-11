import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {BarXInteractionItem} from './interaction-types';
import type {PreparedBarXData} from './types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs<PreparedBarXData>): InteractionElement<BarXInteractionItem>[] {
    return getInteractionElements<PreparedBarXData, BarXInteractionItem>(
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
}: PrepareNearestDataArgs<PreparedBarXData>): NearestCandidate<BarXInteractionItem>[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
