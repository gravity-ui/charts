import type {AxisDomain, AxisScale} from 'd3';

import type {
    PreparedAxisPlotBand,
    PreparedAxisPlotLine,
    PreparedXAxis,
    PreparedYAxis,
} from '../../hooks';
import type {ChartScale} from '../../hooks/useAxisScales/types';
import type {AxisPlotBand, AxisPlotLine} from '../../types';

import {getBandsPosition, isBandScale} from './axis/common';

const PLOT_LINE_HIT_THRESHOLD_PX = 4;

function getHoveredAxisPlotBands(args: {
    pointerPx: number;
    plotBands: PreparedAxisPlotBand[];
    scale: ChartScale;
    axis: 'x' | 'y';
}): AxisPlotBand[] {
    const {pointerPx, plotBands, scale, axis} = args;
    const axisScale = scale as AxisScale<AxisDomain>;
    const result: AxisPlotBand[] = [];

    for (const band of plotBands) {
        const {from, to} = getBandsPosition({band, axisScale, axis});
        const halfBandwidth = (axisScale.bandwidth?.() ?? 0) / 2;
        const startPx = halfBandwidth + Math.min(from, to);
        const endPx = halfBandwidth + Math.max(from, to);

        if (pointerPx >= startPx && pointerPx <= endPx) {
            result.push(band);
        }
    }

    return result;
}

function getHoveredAxisPlotLines(args: {
    pointerPx: number;
    plotLines: PreparedAxisPlotLine[];
    scale: ChartScale;
}): AxisPlotLine[] {
    const {pointerPx, plotLines, scale} = args;
    const result: AxisPlotLine[] = [];

    if (isBandScale(scale)) {
        return result;
    }

    for (const line of plotLines) {
        const linePx = Number(scale(line.value));

        if (Math.abs(pointerPx - linePx) <= PLOT_LINE_HIT_THRESHOLD_PX + line.width / 2) {
            result.push(line);
        }
    }

    return result;
}

export function getHoveredPlots(args: {
    pointerX: number;
    pointerY: number;
    xAxis?: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
}): {plotLines: AxisPlotLine[]; plotBands: AxisPlotBand[]} {
    const {pointerX, pointerY, xAxis, yAxis, xScale, yScale} = args;
    const plotLines: AxisPlotLine[] = [];
    const plotBands: AxisPlotBand[] = [];

    if (xAxis && xScale) {
        plotBands.push(
            ...getHoveredAxisPlotBands({
                pointerPx: pointerX,
                plotBands: xAxis.plotBands,
                scale: xScale,
                axis: 'x',
            }),
        );
        plotLines.push(
            ...getHoveredAxisPlotLines({
                pointerPx: pointerX,
                plotLines: xAxis.plotLines,
                scale: xScale,
            }),
        );
    }

    for (let i = 0; i < yAxis.length; i++) {
        const yAxisItem = yAxis[i];
        const yScaleItem = yScale?.[i];
        if (!yAxisItem || !yScaleItem) {
            continue;
        }
        plotBands.push(
            ...getHoveredAxisPlotBands({
                pointerPx: pointerY,
                plotBands: yAxisItem.plotBands,
                scale: yScaleItem,
                axis: 'y',
            }),
        );
        plotLines.push(
            ...getHoveredAxisPlotLines({
                pointerPx: pointerY,
                plotLines: yAxisItem.plotLines,
                scale: yScaleItem,
            }),
        );
    }

    return {plotLines, plotBands};
}
