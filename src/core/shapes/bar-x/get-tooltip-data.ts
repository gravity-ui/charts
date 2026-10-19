import {max, min} from 'd3-array';
import groupBy from 'lodash/groupBy';

import {getRectDistance} from '../../utils/geometry';
import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';

import type {PreparedBarXData} from './types';
import {getBarXRect} from './utils';

export function getTooltipData(args: GetTooltipDataArgs<PreparedBarXData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const barXGroups = groupBy(data, (d) => String(d.data.x));
    const centers: Record<string, number> = Object.fromEntries(
        Object.entries(barXGroups).map(([key, group]) => {
            const overlay = group.find((d) => d.series.grouping === false);
            // Slot centers stay symmetric around the category even when bar widths differ.
            const center = overlay
                ? overlay.x + overlay.width / 2
                : ((min(group, (d) => d.x + d.width / 2) ?? 0) +
                      (max(group, (d) => d.x + d.width / 2) ?? 0)) /
                  2;
            return [key, center];
        }),
    );
    const hasOverlays = data.some((d) => d.series.grouping === false);
    const xLookupPoints: ShapePoint[] = data.map((d, priority) => {
        const distance =
            hasOverlays || measureDistance
                ? getRectDistance(getBarXRect(d), ...position)
                : undefined;
        return {
            data: d.data,
            // Set only for the own candidate; all points of a series share one value.
            distance: measureDistance ? distance : undefined,
            percentage: d.percentage,
            series: d.series,
            x: centers[String(d.data.x)],
            y0: d.y,
            y1: d.y + d.height,
            sourceX: d.x + d.width / 2,
            hitTest: hasOverlays && distance !== undefined ? {distance, priority} : undefined,
        };
    });

    return {chunks: [], xLookupPoints};
}
