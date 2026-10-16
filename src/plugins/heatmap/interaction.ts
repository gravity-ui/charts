import type {HeatmapItem, PreparedHeatmapData} from '~core/shapes/heatmap/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {HeatmapInteractionItem} from './interaction-types';

export function getTargetElements({
    plot,
    preparedData,
}: InteractionElementsArgs): InteractionElement<HeatmapInteractionItem>[] {
    const shape = preparedData[0] as PreparedHeatmapData | undefined;
    if (!shape) return [];
    const {series} = shape;
    return getInteractionElements<HeatmapItem, HeatmapInteractionItem>(plot, 'rect', (datum) => ({
        point: datum.data,
        series,
    }));
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedHeatmapData>): NearestCandidate<HeatmapInteractionItem>[] {
    const shape = data[0];
    return (
        shape?.items.map((item) => ({
            position: [item.x + item.width / 2, item.y + item.height / 2],
            item: {point: item.data, series: shape.series},
        })) ?? []
    );
}
