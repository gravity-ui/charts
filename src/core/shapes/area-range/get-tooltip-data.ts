import type {AreaRangeSeries} from '../../../types';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedAreaRangeData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedAreaRangeData>,
): GetTooltipDataResult {
    const xLookupPoints = args.data.reduce<ShapePoint[]>((acc, item) => {
        item.points.forEach((point) => {
            if (point.low === null || point.high === null) {
                return;
            }

            acc.push({
                color: point.fill ?? point.color ?? point.series.color,
                data: point.data,
                series: point.series as unknown as AreaRangeSeries,
                x: point.x,
                y0: Math.min(point.low, point.high),
                y1: Math.max(point.low, point.high),
            });
        });
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
