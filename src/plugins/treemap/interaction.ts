import type {PreparedTreemapData} from '~core/shapes/treemap/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {TreemapInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
    preparedData,
}: InteractionElementsArgs): InteractionElement<TreemapInteractionItem>[] {
    const shape = preparedData[0] as PreparedTreemapData | undefined;
    if (!shape) return [];
    const {series} = shape;
    return getInteractionElements<PreparedTreemapData['leaves'][number], TreemapInteractionItem>(
        plot,
        'rect',
        (datum) => ({
            point: datum.data,
            series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedTreemapData>): NearestCandidate<TreemapInteractionItem>[] {
    const shape = data[0];
    return (
        shape?.leaves.map((leaf) => ({
            position: [(leaf.x0 + leaf.x1) / 2, (leaf.y0 + leaf.y1) / 2],
            item: {point: leaf.data, series: shape.series},
        })) ?? []
    );
}
