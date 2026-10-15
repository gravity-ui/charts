import type {PreparedAreaSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import type {PointData, PreparedAreaData} from '~core/shapes/area/types';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import type {AreaSeriesData} from '../../types';

const sourcePoints = new WeakMap<AreaSeriesData[], Set<AreaSeriesData>>();
const shapePoints = new WeakMap<PreparedAreaData, PointData[]>();

function getSourcePoints(series: PreparedAreaSeries) {
    const data = series.fullData ?? series.data;
    let points = sourcePoints.get(data);
    if (!points) {
        points = new Set(data);
        sourcePoints.set(data, points);
    }
    return points;
}

function getAreaPoints(shape: PreparedAreaData) {
    let points = shapePoints.get(shape);
    if (!points) {
        const source = getSourcePoints(shape.series);
        const seen = new Set<AreaSeriesData>();
        // Stacking adds missing-column zeros and may project one source point twice.
        points = shape.points.filter(({data}) => {
            if (!source.has(data) || seen.has(data)) return false;
            seen.add(data);
            return true;
        });
        shapePoints.set(shape, points);
    }
    return points;
}

export function getTargetElements({plot, markers, preparedData}: InteractionElementsArgs) {
    const shapes = preparedData as PreparedAreaData[];
    return [
        ...getInteractionElements<PreparedAreaData>(
            plot,
            '.gcharts-area__line, .gcharts-area__region',
            (shape) => ({
                point: getShapePoint(shape, getAreaPoints(shape)),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements(markers, shapes).filter(({item}) =>
            getSourcePoints(item.series as PreparedAreaSeries).has(item.point as AreaSeriesData),
        ),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaData>,
): NearestCandidate[] {
    return getPointCandidates(
        (getTooltipData({...args, measureDistance: false}).xLookupPoints ?? []).filter((point) =>
            getSourcePoints(point.series as PreparedAreaSeries).has(point.data as AreaSeriesData),
        ),
    );
}
