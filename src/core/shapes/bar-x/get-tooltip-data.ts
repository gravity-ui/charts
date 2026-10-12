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
    const centers: Record<string, number> = Object.fromEntries(
        Object.entries(barXGroups).map(([key, group]) => {
            const overlay = group.find((d) => d.series.grouping === false);
            const center = overlay
                ? overlay.x + overlay.width / 2
                : group.reduce((sum, d) => sum + d.x + d.width / 2, 0) / group.length;
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
        hitTest: hasOverlays ? {x0: d.x, x1: d.x + d.width, priority} : undefined,
    }));

    return {chunks: [], xLookupPoints};
}
