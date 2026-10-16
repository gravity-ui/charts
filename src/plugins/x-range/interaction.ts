import type {PreparedXRangeData} from '~core/shapes/x-range/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {XRangeInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs): InteractionElement<XRangeInteractionItem>[] {
    return getInteractionElements<PreparedXRangeData, XRangeInteractionItem>(
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
}: PrepareNearestDataArgs<PreparedXRangeData>): NearestCandidate<XRangeInteractionItem>[] {
    return data.map((shape) => ({
        position: [shape.x + shape.width / 2, shape.y + shape.height / 2],
        item: {point: shape.data, series: shape.series},
    }));
}
