import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedLineSeries} from '~core/series/types';
import {projectLineData} from '~core/shapes/line/prepare-data';

import {appendMarkerPadding} from '../marker-axis-padding';

export function getLineAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const points: AxisPaddingPoint[] = [];
    const projected = projectLineData({
        ...args,
        series: args.series as PreparedLineSeries[],
        isOutsideBounds: () => false,
    });
    for (const item of projected) {
        const yScale = args.yScale[item.series.yAxis];
        if (!yScale) continue;
        appendMarkerPadding({
            points: item.points,
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
