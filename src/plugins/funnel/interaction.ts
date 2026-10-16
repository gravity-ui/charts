import type {FunnelItemData, PreparedFunnelData} from '~core/shapes/funnel/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {FunnelInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs): InteractionElement<FunnelInteractionItem>[] {
    return getInteractionElements<FunnelItemData, FunnelInteractionItem>(
        plot,
        'polygon',
        (datum) => ({
            point: datum.data,
            series: datum.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedFunnelData>): NearestCandidate<FunnelInteractionItem>[] {
    return data.flatMap((shape) =>
        shape.items.map((item) => ({
            position: [item.x + item.width / 2, item.y + item.height / 2],
            item: {point: item.data, series: item.series},
        })),
    );
}
