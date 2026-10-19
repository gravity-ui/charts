import type {PlotPaddingContribution, PreparePlotPaddingArgs} from '~core/layout/plot-padding';
import type {PreparedScatterSeries} from '~core/series/types';
import {getScatterMarkerBounds} from '~core/shapes/scatter/marker-bounds';
import {getXValue, getYValue} from '~core/shapes/utils';
import type {ChartMargin} from '~core/types';

import {createPaddingPointFilter} from '../marker-plot-padding';

export function getScatterPlotPadding(args: PreparePlotPaddingArgs): PlotPaddingContribution {
    const points: PlotPaddingContribution['points'] = [];
    const hoverEnabled = args.seriesOptions?.scatter?.states?.hover?.enabled !== false;
    for (const s of args.series as PreparedScatterSeries[]) {
        const yScale = args.yScale[s.yAxis];
        if (!yScale) continue;
        const inRange = createPaddingPointFilter(args.xScale, yScale);
        const cache = new Map<number | undefined, ChartMargin>();
        // A range inset can regroup grid cells. Bound every potential cluster by
        // its members instead of iterating clustering and layout to a fixed point.
        const clusterBounds =
            s.cluster.enabled && s.data.length >= s.cluster.minimumClusterSize
                ? getScatterMarkerBounds(
                      {
                          ...s,
                          marker: {
                              states: {
                                  normal: {...s.marker.states.normal, ...s.cluster.marker},
                                  hover: {
                                      ...s.marker.states.hover,
                                      ...s.cluster.marker,
                                      enabled:
                                          s.marker.states.hover.enabled && s.cluster.marker.enabled,
                                  },
                              },
                          },
                      },
                      undefined,
                      hoverEnabled,
                  )
                : undefined;
        for (const data of s.data) {
            const x = getXValue({point: data, xAxis: args.xAxis, xScale: args.xScale});
            const y = getYValue({point: data, yAxis: args.yAxis[s.yAxis], yScale});
            if (x === null || y === null || !inRange(x, y)) continue;
            let bounds = cache.get(data.radius);
            if (!bounds) {
                bounds = getScatterMarkerBounds(s, data.radius, hoverEnabled);
                if (clusterBounds) {
                    for (const side of ['left', 'right', 'top', 'bottom'] as const)
                        bounds[side] = Math.max(bounds[side], clusterBounds[side]);
                }
                cache.set(data.radius, bounds);
            }
            points.push({x, y, ...bounds});
        }
    }
    return {points, options: args.seriesOptions?.scatter?.plotPadding};
}
