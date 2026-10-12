import {max, min} from 'd3-array';
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
        const groupCenterX =
            ((min(group, (d) => d.x) ?? 0) + (max(group, (d) => d.x + d.width) ?? 0)) / 2;
        for (const d of group) {
            xLookupPoints.push({
                data: d.data,
                percentage: d.percentage,
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
