import type {HeatmapItem, PreparedHeatmapData} from '~core/shapes/heatmap/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {
    InteractionElementsArgs,
    NearestCandidate,
    PrepareNearestDataArgs,
} from '~core/utils/chart-interaction';

export function getTargetElements({plot, preparedData}: InteractionElementsArgs) {
    const {series} = preparedData[0] as PreparedHeatmapData;
    return getInteractionElements<HeatmapItem>(plot, 'rect', (datum) => ({
        point: datum.data,
        series,
    }));
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedHeatmapData>): NearestCandidate[] {
    const shape = data[0];
    return (
        shape?.items.map((item) => ({
            position: [item.x + item.width / 2, item.y + item.height / 2],
            item: {point: item.data, series: shape.series},
        })) ?? []
    );
}
