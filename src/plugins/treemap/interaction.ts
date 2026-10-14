import type {PreparedTreemapData} from '~core/shapes/treemap/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

export function getTargetElements({plot, preparedData}: InteractionElementsArgs) {
    const {series} = preparedData[0] as PreparedTreemapData;
    return getInteractionElements<PreparedTreemapData['leaves'][number]>(plot, 'rect', (datum) => ({
        point: datum.data,
        series,
    }));
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedTreemapData>): NearestCandidate[] {
    const shape = data[0];
    return (
        shape?.leaves.map((leaf) => ({
            position: [(leaf.x0 + leaf.x1) / 2, (leaf.y0 + leaf.y1) / 2],
            item: {point: leaf.data, series: shape.series},
        })) ?? []
    );
}
