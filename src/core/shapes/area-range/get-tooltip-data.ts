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
            if (point.y0 === null || point.y1 === null) {
                return;
            }

            acc.push({
                color: point.fill ?? point.color ?? point.series.color,
                data: point.data,
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
