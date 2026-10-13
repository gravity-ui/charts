import {max, min} from 'd3-array';
import groupBy from 'lodash/groupBy';

import type {BarXSeries} from '../../../types';
import {getRectDistance} from '../../utils/rect-distance';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedBarXData} from './types';
import {getBarXRect} from './utils';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarXData>): GetTooltipDataResult {
    const {data, position} = args;

    const barXGroups = groupBy(data, (d) => String(d.data.x));
    const centers: Record<string, number> = Object.fromEntries(
        Object.entries(barXGroups).map(([key, group]) => {
            const overlay = group.find((d) => d.series.grouping === false);
            const center = overlay
                ? overlay.x + overlay.width / 2
                : ((min(group, (d) => d.x) ?? 0) + (max(group, (d) => d.x + d.width) ?? 0)) / 2;
            return [key, center];
        }),
    );
    const hasOverlays = data.some((d) => d.series.grouping === false);
    const xLookupPoints: ShapePoint[] = data.map((d, priority) => ({
        data: d.data,
        percentage: d.percentage,
        series: d.series as BarXSeries,
        x: centers[String(d.data.x)],
        y0: d.y,
        y1: d.y + d.height,
        sourceX: d.x + d.width / 2,
        hitTest: hasOverlays
            ? {distance: getRectDistance(getBarXRect(d), ...position), priority}
            : undefined,
    }));

    return {chunks: [], xLookupPoints};
}
