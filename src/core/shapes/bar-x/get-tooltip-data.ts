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

    for (const group of Object.values(barXGroups)) {
        const groupCenterX = group.reduce((sum, d) => sum + d.x + d.width / 2, 0) / group.length;
        for (const d of group) {
            if (d.excluded) {
                continue;
            }
            xLookupPoints.push({
                data: d.data,
                series: d.series as BarXSeries,
                x: groupCenterX,
                y0: d.y,
                y1: d.y + d.height,
                sourceX: d.x + d.width / 2,
            });
        }
    }

    return {chunks: [], xLookupPoints};
}
