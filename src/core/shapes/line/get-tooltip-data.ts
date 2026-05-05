import type {LineSeries} from '../../../types';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedLineData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedLineData>): GetTooltipDataResult {
    const {data} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        for (const p of d.points) {
            if (p.y !== null && p.x !== null && !p.hiddenInLine) {
                acc.push({
                    data: p.data,
                    series: p.series as LineSeries,
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
