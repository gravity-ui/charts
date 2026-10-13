import type {AreaRangeSeries} from '../../../types';
import {getDistanceToBand} from '../../utils/tooltip-helpers';
import type {
    BandColumn,
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedAreaRangeData} from './types';

const bandColumns = new WeakMap<PreparedAreaRangeData, BandColumn[]>();

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

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedAreaRangeData>,
): GetTooltipDataResult {
    const xLookupPoints = args.data.reduce<ShapePoint[]>((acc, item) => {
        const distance = args.measureDistance
            ? Math.max(
                  0,
                  getDistanceToBand({point: args.position, columns: getBandColumns(item)}) -
                      item.width / 2,
              )
            : 0;
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
