import groupBy from 'lodash/groupBy';

import type {BarXSeries} from '../../../types';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedBarXData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarXData>): GetTooltipDataResult {
    const {data} = args;

    const barXGroups = groupBy(data, (d) => String(d.data.x));
    const xLookupPoints: ShapePoint[] = [];
    const paintOrder = data.some((d) => d.series.grouping === false && !d.series.stacking)
        ? new Map(data.map((d, index) => [d, index]))
        : undefined;

    for (const group of Object.values(barXGroups)) {
        const groupCenterX = group.reduce((sum, d) => sum + d.x + d.width / 2, 0) / group.length;
        for (const d of group) {
            xLookupPoints.push({
                data: d.data,
                percentage: d.percentage,
                series: d.series as BarXSeries,
                x: groupCenterX,
                y0: d.y,
                y1: d.y + d.height,
                sourceX: d.x + d.width / 2,
                hitTest: paintOrder
                    ? {x0: d.x, x1: d.x + d.width, priority: paintOrder.get(d) ?? 0}
                    : undefined,
            });
        }
    }

    return {chunks: [], xLookupPoints};
}
