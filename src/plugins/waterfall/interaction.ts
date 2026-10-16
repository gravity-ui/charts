import type {PreparedWaterfallData} from '~core/shapes/waterfall/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {WaterfallInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs): InteractionElement<WaterfallInteractionItem>[] {
    return getInteractionElements<PreparedWaterfallData, WaterfallInteractionItem>(
        plot,
        '.gcharts-waterfall__segment',
        (datum) => ({
            point: datum.data,
            series: datum.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedWaterfallData>): NearestCandidate<WaterfallInteractionItem>[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
