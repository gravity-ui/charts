import type {PlotPaddingContribution, PreparePlotPaddingArgs} from '~core/layout/plot-padding';
import type {PreparedAreaSeries} from '~core/series/types';
import {projectAreaData} from '~core/shapes/area/prepare-data';

import {appendMarkerPadding} from '../marker-plot-padding';

export function getAreaPlotPadding(args: PreparePlotPaddingArgs): PlotPaddingContribution {
    const points: PlotPaddingContribution['points'] = [];
    const projected = projectAreaData({
        ...args,
        series: args.series as PreparedAreaSeries[],
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
    return {points, options: args.seriesOptions?.area?.plotPadding};
}
