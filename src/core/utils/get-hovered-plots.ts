import type {AxisDomain, AxisScale} from 'd3-axis';

import type {AxisPlotBand, AxisPlotLine, AxisPlotShape} from '../../types';
import type {
    PreparedAxisPlotBand,
    PreparedAxisPlotLine,
    PreparedAxisPlotShape,
    PreparedXAxis,
    PreparedYAxis,
} from '../axes/types';
import type {ChartScale} from '../scales/types';

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
        const startPx = Math.min(from, to);
        const endPx = Math.max(from, to);

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

function getHoveredAxisPlotShapes(args: {
    pointerX: number;
    pointerY: number;
    plotShapes: PreparedAxisPlotShape[];
}): AxisPlotShape[] {
    const {pointerX, pointerY, plotShapes} = args;
    const result: AxisPlotShape[] = [];

    for (const shape of plotShapes) {
        const left = shape.x + shape.hitbox.x;
        const top = shape.y + shape.hitbox.y;
        const inX = pointerX >= left && pointerX <= left + shape.hitbox.width;
        const inY = pointerY >= top && pointerY <= top + shape.hitbox.height;

        if (inX && inY) {
            result.push(shape);
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
}): {plotBands: AxisPlotBand[]; plotLines: AxisPlotLine[]; plotShapes: AxisPlotShape[]} {
    const {pointerX, pointerY, xAxis, yAxis, xScale, yScale} = args;
    const plotBands: AxisPlotBand[] = [];
    const plotLines: AxisPlotLine[] = [];
    const plotShapes: AxisPlotShape[] = [];

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
        plotShapes.push(
            ...getHoveredAxisPlotShapes({
                pointerX,
                pointerY,
                plotShapes: xAxis.plotShapes,
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
        plotShapes.push(
            ...getHoveredAxisPlotShapes({
                pointerX,
                pointerY,
                plotShapes: yAxisItem.plotShapes,
            }),
        );
    }

    return {plotBands, plotLines, plotShapes};
}
