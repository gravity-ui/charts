import type {AreaRangeSeries} from '../../../types';
import {getDistanceToStrokedPolyline} from '../../utils/geometry';
import type {Point} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getBandBoundaries, getDistanceToBand} from '../area/band';
import type {BandColumn} from '../area/band';

import type {PreparedAreaRangeData} from './types';

interface AreaRangeGeometry {
    columns: BandColumn[];
    /** Runs of the stroked upper and lower lines. */
    boundaries: Point[][];
}

const geometryCache = new WeakMap<PreparedAreaRangeData, AreaRangeGeometry>();

function getAreaRangeGeometry(item: PreparedAreaRangeData): AreaRangeGeometry {
    let geometry = geometryCache.get(item);
    if (!geometry) {
        const columns = item.points.map<BandColumn>((p) =>
            p.hiddenInLine || p.y0 === null || p.y1 === null ? null : {x: p.x, y0: p.y0, y1: p.y1},
        );
        const {upper, lower} = getBandBoundaries(columns);
        geometry = {columns, boundaries: [...upper, ...lower]};
        geometryCache.set(item, geometry);
    }
    return geometry;
}

/** Distance to the filled band and its stroked boundary lines (round caps and joins). */
function getDistanceToAreaRange(item: PreparedAreaRangeData, point: Point) {
    const {columns, boundaries} = getAreaRangeGeometry(item);
    let distance = getDistanceToBand({point, columns});
    for (let i = 0; i < boundaries.length && distance > 0; i++) {
        distance = Math.min(
            distance,
            getDistanceToStrokedPolyline({
                point,
                vertices: boundaries[i],
                halfWidth: item.width / 2,
                linecap: 'round',
            }),
        );
    }
    return distance;
}

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedAreaRangeData>,
): GetTooltipDataResult {
    const xLookupPoints = args.data.reduce<ShapePoint[]>((acc, item) => {
        const distance = args.measureDistance
            ? getDistanceToAreaRange(item, args.position)
            : undefined;
        item.points.forEach((point) => {
            if (point.hiddenInTooltip || point.y0 === null || point.y1 === null) {
                return;
            }

            acc.push({
                color: point.fill ?? point.color ?? point.series.color,
                data: point.data,
                distance,
                series: point.series as unknown as AreaRangeSeries,
                x: point.x,
                y0: Math.min(point.y0, point.y1),
                y1: Math.max(point.y0, point.y1),
            });
        });
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
