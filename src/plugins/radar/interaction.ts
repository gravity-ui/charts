import type {PreparedRadarData, RadarMarkerData, RadarShapeData} from '~core/shapes/radar/types';
import {getInteractionElements, getShapePoint} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return [
        ...getInteractionElements<RadarShapeData>(plot, '.gcharts-radar__area > path', (shape) => ({
            point: getShapePoint(shape, shape.points),
            series: shape.series,
        })),
        ...getInteractionElements<RadarMarkerData>(plot, '.gcharts-marker__symbol', (marker) =>
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
}: PrepareNearestDataArgs<PreparedRadarData>): NearestCandidate[] {
    return data.flatMap((shape) =>
        shape.shapes.flatMap((seriesShape) =>
            seriesShape.points.map((point) => ({
                position: point.position,
                item: {point: point.data, series: point.series},
            })),
        ),
    );
}
