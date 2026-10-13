import type {AreaSeries} from '../../../types';
import {getDistanceToBand} from '../../utils/tooltip-helpers';
import type {
    BandColumn,
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import type {PreparedAreaData} from './types';

const bandColumns = new WeakMap<PreparedAreaData, BandColumn[]>();

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
    const fillDistance = getDistanceToBand({point, columns: getBandColumns(item)});
    return Math.min(
        Math.max(0, fillDistance - item.width / 2),
        getDistanceToMarkers(item.markers, point),
    );
}

export function getTooltipData(args: GetTooltipDataArgs<PreparedAreaData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        const distance = measureDistance ? getDistanceToArea(d, position) : 0;
        for (const p of d.points) {
            if (p.y === null || p.hiddenInLine) {
                continue;
            }
            acc.push({
                color: getMarkerFill(p, p.series.color),
                data: p.data,
                distance,
                percentage: p.percentage,
                series: p.series as AreaSeries,
                x: p.x,
                y0: p.y0,
                y1: p.y,
            });
        }
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
