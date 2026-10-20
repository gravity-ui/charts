import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedAreaRangeSeries} from '~core/series/types';
import {projectAreaRangeData} from '~core/shapes/area-range/prepare-data';

import {appendMarkerPadding} from '../marker-axis-padding';

export function getAreaRangeAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const points: AxisPaddingPoint[] = [];
    const projected = projectAreaRangeData({
        ...args,
        series: args.series as PreparedAreaRangeSeries[],
        isOutsideBounds: () => false,
    });
    for (const item of projected) {
        const yScale = args.yScale[item.series.yAxis];
        if (!yScale) continue;
        appendMarkerPadding({
            points: item.points
                .filter((p) => !p.hiddenInTooltip)
                .flatMap((p) => [
                    {x: p.x, y: p.y0, data: p.data},
                    {x: p.x, y: p.y1, data: p.data},
                ]),
            marker: item.series.marker,
            xScale: args.xScale,
            yScale,
            top: args.split.plots[args.yAxis[item.series.yAxis].plotIndex]?.top ?? 0,
            yAxis: item.series.yAxis,
            result: points,
        });
    }
    return points;
}
