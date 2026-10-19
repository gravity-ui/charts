import {getDistanceToStrokedPolyline} from '../../utils/geometry';
import type {Point} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import {getBandBoundaries, getDistanceToBand} from './band';
import type {BandColumn} from './band';
import type {PreparedAreaData} from './types';

interface AreaGeometry {
    columns: BandColumn[];
    /** Runs of the upper line, the only stroked boundary of the area. */
    upper: Point[][];
}

const geometryCache = new WeakMap<PreparedAreaData, AreaGeometry>();

function getAreaGeometry(item: PreparedAreaData): AreaGeometry {
    let geometry = geometryCache.get(item);
    if (!geometry) {
        const columns = item.points.map<BandColumn>((p) =>
            p.y === null || p.hiddenInLine ? null : {x: p.x, y0: p.y0, y1: p.y},
        );
        geometry = {columns, upper: getBandBoundaries(columns).upper};
        geometryCache.set(item, geometry);
    }
    return geometry;
}

/** Distance to the filled band, its stroked upper line (round caps and joins) and markers. */
function getDistanceToArea(item: PreparedAreaData, point: Point) {
    const {columns, upper} = getAreaGeometry(item);
    let distance = getDistanceToBand({point, columns});
    for (let i = 0; i < upper.length && distance > 0; i++) {
        distance = Math.min(
            distance,
            getDistanceToStrokedPolyline({
                point,
                vertices: upper[i],
                halfWidth: item.width / 2,
                linecap: 'round',
            }),
        );
    }
    return Math.min(distance, getDistanceToMarkers(item.markers, point));
}

export function getTooltipData(args: GetTooltipDataArgs<PreparedAreaData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        const distance = measureDistance ? getDistanceToArea(d, position) : undefined;
        for (const p of d.points) {
            if (p.y === null || p.hiddenInLine) {
                continue;
            }

            acc.push({
                color: getMarkerFill(p, p.series.color),
                data: p.data,
                distance,
                percentage: p.percentage,
                series: p.series,
                x: p.x,
                y0: p.y0,
                y1: p.y,
            });
        }
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
