import {extent} from 'd3-array';

import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedLineSeries} from '~core/series/types';

import {getCurveFactory} from '../interpolation';
import {collectMarkerPadding} from '../marker-axis-padding';
import {getVisiblePathYValues} from '../path-domain';

import {hasSmoothInterpolation} from './path';
import {projectLineData} from './prepare-data';

export function getLineAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const projected = projectLineData({
        ...args,
        series: args.series as PreparedLineSeries[],
        isOutsideBounds: () => false,
    });
    const padding = collectMarkerPadding(args, projected);
    const xRange = args.xScale.range();
    const xMin = Math.min(...xRange);
    const xMax = Math.max(...xRange);
    if (args.xAxis.type === 'category' || xMin >= xMax) {
        return padding;
    }
    for (const {points, series, lineWidth} of projected) {
        const {yAxis} = series;
        const axis = args.yAxis[yAxis];
        const scale = args.yScale[yAxis];
        const fitMin = axis.min === undefined && axis.padding?.min === 'auto';
        const fitMax = axis.max === undefined && axis.padding?.max === 'auto';
        if (
            (!fitMin && !fitMax) ||
            axis.type === 'category' ||
            !scale ||
            !Number.isFinite(lineWidth) ||
            lineWidth <= 0 ||
            !hasSmoothInterpolation(series)
        ) {
            continue;
        }
        const offset = args.split.plots[axis.plotIndex]?.top ?? 0;
        const [first, last] = scale.range();
        const low = Math.min(first, last);
        const high = Math.max(first, last);
        if (low >= high) {
            continue;
        }
        const extrema = getVisiblePathYValues({
            points,
            viewport: {x: {type: 'linear', range: [xMin, xMax]}, y: {type: 'linear'}},
            curveFactory: getCurveFactory(series.interpolation),
        });
        const [top, bottom] = extent(extrema ?? [], (value) => Number(value) - offset);
        // Reserve room for the centered stroke at the curve's Y extrema.
        const halfWidth = lineWidth / 2;
        for (const y of [top, bottom]) {
            if (y !== undefined && y >= low - 0.5 && y <= high + 0.5) {
                padding.push({
                    x: xMin,
                    y,
                    yAxis,
                    top: halfWidth,
                    bottom: halfWidth,
                    left: 0,
                    right: 0,
                });
            }
        }
    }
    return padding;
}
