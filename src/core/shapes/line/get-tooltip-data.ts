import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getMarkerFill} from '../marker';

import type {PreparedLineData} from './types';

export function getTooltipData(
    args: Pick<GetTooltipDataArgs<PreparedLineData>, 'data'>,
): GetTooltipDataResult {
    const {data} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        for (const p of d.points) {
            if (p.y !== null && p.x !== null && !p.hiddenInLine) {
                acc.push({
                    color: getMarkerFill(p, p.series.color),
                    data: p.data,
                    series: p.series,
                    x: p.x,
                    y0: p.y,
                    y1: p.y,
                });
            }
        }
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
