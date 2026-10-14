import {getDistanceToBand} from '../../utils/geometry';
import type {BandColumn} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {createLineGeometryGetter, getDistanceToLineStroke} from '../line/geometry';
import type {LineGeometry} from '../line/geometry';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import type {PreparedAreaData} from './types';

const bandColumns = new WeakMap<PreparedAreaData, BandColumn[]>();
const lineGeometry = new WeakMap<PreparedAreaData, LineGeometry>();

function getBandColumns(item: PreparedAreaData) {
    let columns = bandColumns.get(item);
    if (!columns) {
        columns = item.points.map((p) =>
            p.y === null || p.hiddenInLine ? null : {x: p.x, y0: p.y0, y1: p.y},
        );
        bandColumns.set(item, columns);
    }
    return columns;
}

function getDistanceToArea(item: PreparedAreaData, point: [number, number]) {
    let geometry = lineGeometry.get(item);
    if (!geometry) {
        geometry = createLineGeometryGetter({points: item.points, lineWidth: item.width})();
        lineGeometry.set(item, geometry);
    }
    const fillDistance = getDistanceToBand({point, columns: getBandColumns(item)});
    return Math.min(
        fillDistance,
        getDistanceToLineStroke(geometry, point, {
            lineWidth: item.width,
            linecap: 'round',
            linejoin: 'round',
            dashStyle: 'Solid',
        }),
        getDistanceToMarkers(item.markers, point),
    );
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
