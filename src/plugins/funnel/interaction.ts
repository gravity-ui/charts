import type {FunnelItemData, PreparedFunnelData} from '~core/shapes/funnel/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<FunnelItemData>(plot, 'polygon', (datum) => ({
        point: datum.data,
        series: datum.series,
    }));
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedFunnelData>): NearestCandidate[] {
    return data.flatMap((shape) =>
        shape.items.map((item) => ({
            position: [item.x + item.width / 2, item.y + item.height / 2],
            item: {point: item.data, series: item.series},
        })),
    );
}
