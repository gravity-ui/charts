import {getDistanceToBand} from '../../utils/geometry';
import type {BandColumn} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {createLineGeometryGetter, getDistanceToLineStroke} from '../line/geometry';
import type {LineGeometry} from '../line/geometry';
import {getDistanceToMarkers} from '../marker';

import type {PreparedAreaRangeData} from './types';

const bandColumns = new WeakMap<PreparedAreaRangeData, BandColumn[]>();
const lineGeometry = new WeakMap<PreparedAreaRangeData, LineGeometry[]>();

function getBandColumns(item: PreparedAreaRangeData) {
    let columns = bandColumns.get(item);
    if (!columns) {
        columns = item.points.map((p) =>
            p.hiddenInLine || p.y0 === null || p.y1 === null ? null : {x: p.x, y0: p.y0, y1: p.y1},
        );
        bandColumns.set(item, columns);
    }
    return columns;
}

function getDistanceToAreaRange(item: PreparedAreaRangeData, point: [number, number]) {
    let boundaries = lineGeometry.get(item);
    if (!boundaries) {
        boundaries = (['y0', 'y1'] as const).map((boundary) =>
            createLineGeometryGetter({
                points: item.points.map((p) => ({
                    x: p.x,
                    y: p.y0 === null || p.y1 === null ? null : p[boundary],
                    hiddenInLine: p.hiddenInLine,
                })),
                lineWidth: item.width,
            })(),
        );
        lineGeometry.set(item, boundaries);
    }
    let distance = Math.min(
        getDistanceToBand({point, columns: getBandColumns(item)}),
        getDistanceToMarkers(item.markers, point),
    );
    for (const geometry of boundaries) {
        distance = Math.min(
            distance,
            getDistanceToLineStroke(geometry, point, {
                lineWidth: item.width,
                linecap: 'round',
                linejoin: 'round',
                dashStyle: 'Solid',
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
                series: point.series,
                x: point.x,
                y0: Math.min(point.y0, point.y1),
                y1: Math.max(point.y0, point.y1),
            });
        });
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
