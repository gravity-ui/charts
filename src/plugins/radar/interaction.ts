import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import {getInteractionElements, getShapePoint} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {RadarInteractionItem} from './interaction-types';
import type {PreparedRadarData, RadarMarkerData, RadarShapeData} from './types';

export function getTargetElements({
    plot,
}: InteractionElementsArgs<PreparedRadarData>): InteractionElement<RadarInteractionItem>[] {
    return [
        ...getInteractionElements<RadarShapeData, RadarInteractionItem>(
            plot,
            '.gcharts-radar__area > path',
            (shape) => ({
                point: getShapePoint(shape, shape.points),
                series: shape.series,
            }),
        ),
        ...getInteractionElements<RadarMarkerData, RadarInteractionItem>(
            plot,
            '.gcharts-marker__symbol',
            (marker) =>
                marker.series.marker.states.normal.enabled
                    ? {
                          point: marker.data,
                          series: marker.series,
                      }
                    : undefined,
        ),
    ];
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedRadarData>): NearestCandidate<RadarInteractionItem>[] {
    return data.flatMap((shape) =>
        shape.shapes.flatMap((seriesShape) =>
            seriesShape.points.map((point) => ({
                position: point.position,
                item: {point: point.data, series: point.series},
            })),
        ),
    );
}
