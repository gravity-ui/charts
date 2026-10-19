import type {PlotPaddingContribution, PreparePlotPaddingArgs} from '~core/layout/plot-padding';
import type {PreparedLineSeries} from '~core/series/types';
import {projectLineData} from '~core/shapes/line/prepare-data';

import {appendMarkerPadding} from '../marker-plot-padding';

export function getLinePlotPadding(args: PreparePlotPaddingArgs): PlotPaddingContribution {
    const points: PlotPaddingContribution['points'] = [];
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
            result: points,
        });
    }
    return {points, options: args.seriesOptions?.line?.plotPadding};
}
