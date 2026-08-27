import type {AreaSeries} from '../../../types';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getMarkerFill} from '../marker';

import type {PreparedAreaData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedAreaData>): GetTooltipDataResult {
    const {data} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        for (const p of d.points) {
            if (p.y === null || p.hiddenInLine) {
                continue;
            }
            acc.push({
                color: getMarkerFill(p, p.series.color),
                data: p.data,
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
