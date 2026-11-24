import type {AxisDomain, AxisScale} from 'd3-axis';
import get from 'es-toolkit/compat/get';
import sortBy from 'es-toolkit/compat/sortBy';

import type {LabelData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {
    PreparedSeriesOptions,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../series/types';
import {MIN_BAR_GAP, MIN_BAR_WIDTH} from '../../shapes/bar-constants';
import {PLOT_BOUNDS_PIXEL_TOLERANCE, getXValue, getYValue} from '../../shapes/utils';
import {isPointDataLabelEnabled} from '../../utils';
import {getBandSize} from '../../utils/band-size';
import {getFormattedValue} from '../../utils/format';
import {placeRectLabel} from '../../utils/rect-label-placement';
import {createLabelMeasurer} from '../../utils/text';

import type {PreparedWaterfallData, WaterfallInterval} from './types';

interface PlotBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

const DEFAULT_LABEL_POSITIONS = ['outside'] as const;

async function getLabelData(
    column: PreparedWaterfallData,
    bounds: PlotBounds,
    measureLabel: ReturnType<typeof createLabelMeasurer>,
    endAtMax: boolean,
): Promise<LabelData | undefined> {
    const intersectsX = column.x < bounds.width && column.x + column.width > 0;
    if (!intersectsX || !isPointDataLabelEnabled(column)) {
        return undefined;
    }

    const value = column.data.total ? column.subTotal : Number(column.data.y);
    const {format, style, padding, placement, placementFallback} = column.series.dataLabels;
    const text = getFormattedValue({value: column.data.label ?? value, format});
    const {width, height, hangingOffset} = await measureLabel(text, style, false);
    const placed = placeRectLabel({
        anchor: column,
        bounds,
        size: {width, height},
        axis: 'y',
        endAtMax,
        padding,
        positions: placement ?? DEFAULT_LABEL_POSITIONS,
        fallback: placement ? placementFallback : 'show',
    });
    if (!placed) {
        return undefined;
    }

    return {
        text,
        style,
        size: {width, height, hangingOffset},
        textAnchor: 'middle',
        series: column.series,
        x: placed.x + width / 2,
        y: placed.y + hangingOffset,
    };
}

function getBandWidth(args: {
    series: PreparedWaterfallSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
}) {
    const {series, xAxis, xScale} = args;

    const domain =
        xAxis.type === 'category'
            ? xScale.domain()
            : [...new Set(series.flatMap((s) => s.data.map((point) => Number(point.x))))]
                  .filter(Number.isFinite)
                  .sort((a, b) => a - b);
    return getBandSize({domain, scale: xScale as AxisScale<AxisDomain>});
}

interface DataItem {
    data: PreparedWaterfallSeriesData;
    series: PreparedWaterfallSeries;
}

export const prepareWaterfallData = async (args: {
    series: PreparedWaterfallSeries[];
    intervals: ReadonlyMap<PreparedWaterfallSeriesData, WaterfallInterval>;
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<PreparedWaterfallData[]> => {
    const {
        series,
        intervals,
        seriesOptions,
        boundsWidth,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    } = args;
    if (!yScale) {
        return [];
    }

    const [rangeStart, rangeEnd] = yScale.range();
    const plotTop = Math.min(rangeStart, rangeEnd);
    const plotBottom = Math.max(rangeStart, rangeEnd);
    const bounds = {x: 0, y: plotTop, width: boundsWidth, height: plotBottom - plotTop};
    const canPlaceLabels = bounds.width > 0 && bounds.height > 0;
    const measureLabel = createLabelMeasurer();
    const reversedYAxis = rangeStart < rangeEnd;
    const barMaxWidth = get(seriesOptions, 'waterfall.barMaxWidth');
    const barPadding = get(seriesOptions, 'waterfall.barPadding');

    const data = sortBy<DataItem>(
        series.flatMap((s) => s.data.map((d) => ({data: d, series: s}))),
        (d) => d.data.index,
    );

    const bandWidth = getBandWidth({
        series,
        xAxis,
        xScale,
    });
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(MIN_BAR_WIDTH, Math.min(bandWidth - rectGap, barMaxWidth));

    const result: PreparedWaterfallData[] = [];
    for (const item of data) {
        const xCenter = getXValue({point: item.data, xAxis, xScale});
        if (xCenter === null || !Number.isFinite(xCenter)) continue;

        const interval = intervals.get(item.data);
        if (!interval) continue;

        const {start, end, previousIndex} = interval;
        const startY = getYValue({point: {y: start}, yScale, yAxis});
        const endY = getYValue({point: {y: end}, yScale, yAxis});
        if (startY === null || endY === null) continue;

        const y = Math.max(plotTop, Math.min(startY, endY));
        const bottom = Math.min(plotBottom, Math.max(startY, endY));
        if (!Number.isFinite(y) || !Number.isFinite(bottom)) {
            continue;
        }
        const zeroInterval = start === end;
        const zeroHeight = startY === endY;
        const tolerance = zeroInterval ? PLOT_BOUNDS_PIXEL_TOLERANCE : 0;
        if (y - bottom > tolerance) continue;

        const preparedData: PreparedWaterfallData = {
            x: xCenter - rectWidth / 2,
            y: Math.min(y, plotBottom),
            width: rectWidth,
            height: Math.max(0, bottom - y),
            endY,
            previousIndex,
            opacity: get(item.data, 'opacity', null),
            data: item.data,
            series: item.series,
            subTotal: end,
            htmlLabels: [],
            markers: [],
            getHoverMarkers: () => [],
            annotations: [],
        };

        if (canPlaceLabels && (preparedData.height > 0 || zeroHeight)) {
            const towardHigherValues = zeroInterval ? Boolean(item.data.total) : end > start;
            const endAtMax = zeroHeight ? towardHigherValues === reversedYAxis : endY > startY;
            preparedData.label = await getLabelData(preparedData, bounds, measureLabel, endAtMax);
        }
        result.push(preparedData);
    }
    return result;
};
