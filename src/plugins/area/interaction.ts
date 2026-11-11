import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import {
    getInteractionElements,
    getMarkerInteractionElements,
    getShapePoint,
} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getPointCandidates} from '~core/utils/nearest-point';

import type {AreaSeriesData} from '../../types';

import {getTooltipData} from './get-tooltip-data';
import type {AreaInteractionItem} from './interaction-types';
import type {PreparedAreaSeries} from './prepared-series';
import type {PointData, PreparedAreaData} from './types';

interface AreaMarkerInteractionItem extends AreaInteractionItem {
    point: AreaSeriesData;
    series: PreparedAreaSeries;
}

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

export function getTargetElements({
    plot,
    markers,
    preparedData,
}: InteractionElementsArgs<PreparedAreaData>): InteractionElement<AreaInteractionItem>[] {
    const shapes = preparedData;
    return [
        ...getInteractionElements<PreparedAreaData, AreaInteractionItem>(
            plot,
            '.gcharts-area__line, .gcharts-area__region',
            (shape) => ({
                point: getShapePoint(shape, getAreaPoints(shape)),
                series: shape.series,
            }),
        ),
        ...getMarkerInteractionElements<AreaMarkerInteractionItem>(markers, shapes).filter(
            ({item}) => getSourcePoints(item.series).has(item.point),
        ),
    ];
}

export function prepareNearestData(
    args: PrepareNearestDataArgs<PreparedAreaData>,
): NearestCandidate<AreaInteractionItem>[] {
    return getPointCandidates(
        (getTooltipData({...args, measureDistance: false}).xLookupPoints ?? []).filter((point) =>
            getSourcePoints(point.series).has(point.data),
        ),
    );
}
