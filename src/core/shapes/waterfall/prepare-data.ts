import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
import get from 'es-toolkit/compat/get';
import sortBy from 'es-toolkit/compat/sortBy';

import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {
    PreparedSeriesOptions,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../series/types';
import {MIN_BAR_GAP, MIN_BAR_WIDTH} from '../../shapes/bar-constants';
import {getXValue, getYValue} from '../../shapes/utils';
import {isPointDataLabelEnabled} from '../../utils';
import {getFormattedValue} from '../../utils/format';
import {placeRectLabel} from '../../utils/rect-label-placement';
import {createLabelMeasurer} from '../../utils/text';

import type {PreparedWaterfallData} from './types';

interface PlotSize {
    width: number;
    height: number;
}

const DEFAULT_LABEL_POSITIONS = ['outside'] as const;

async function prepareLabels(data: PreparedWaterfallData[], plot: PlotSize) {
    if (plot.width <= 0 || plot.height <= 0) {
        return;
    }

    const measureLabel = createLabelMeasurer();
    const bounds = {x: 0, y: 0, ...plot};
    for (const column of data) {
        const intersectsX = column.x < plot.width && column.x + column.width > 0;
        const intersectsY =
            column.height === 0
                ? column.y >= 0 && column.y <= plot.height
                : column.height > 0 && column.y < plot.height && column.y + column.height > 0;
        if (!intersectsX || !intersectsY || !isPointDataLabelEnabled(column)) {
            continue;
        }

        const value = column.data.total ? column.subTotal : Number(column.data.y);
        const {format, style, padding, placement, placementFallback} = column.series.dataLabels;
        const text = getFormattedValue({value: column.data.label ?? value, format});
        const {width, height, hangingOffset} = await measureLabel(text, style, false);
        const labelAbove = value > 0 || (column.data.total && value === 0);
        const placed = placeRectLabel({
            anchor: column,
            bounds,
            size: {width, height},
            axis: 'y',
            endAtMax: !labelAbove,
            padding,
            positions: placement ?? DEFAULT_LABEL_POSITIONS,
            fallback: placement ? placementFallback : 'show',
        });
        if (placed) {
            column.label = {
                text,
                style,
                size: {width, height, hangingOffset},
                textAnchor: 'middle',
                series: column.series,
                x: placed.x + width / 2,
                y: placed.y + hangingOffset,
            };
        }
    }
}

function getBandWidth(args: {
    series: PreparedWaterfallSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
}) {
    const {series, xAxis, xScale} = args;

    if (xAxis.type === 'category') {
        const xBandScale = xScale as ScaleBand<string>;
        return xBandScale.bandwidth();
    }

    const xLinearScale = xScale as ScaleLinear<number, number> | ScaleTime<number, number>;
    const xValues = series.reduce<number[]>((acc, s) => {
        s.data.forEach((dataItem) => acc.push(Number(dataItem.x)));
        return acc;
    }, []);

    let bandWidth = Infinity;
    xValues.sort().forEach((xValue, index) => {
        if (index > 0 && xValue !== xValues[index - 1]) {
            const dist = xLinearScale(xValue) - xLinearScale(xValues[index - 1]);
            if (dist < bandWidth) {
                bandWidth = dist;
            }
        }
    });

    return bandWidth;
}

interface DataItem {
    data: PreparedWaterfallSeriesData;
    series: PreparedWaterfallSeries;
}

export const prepareWaterfallData = async (args: {
    series: PreparedWaterfallSeries[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<PreparedWaterfallData[]> => {
    const {
        series,
        seriesOptions,
        boundsWidth,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    } = args;
    const yLinearScale = yScale as ScaleLinear<number, number> | undefined;

    if (!yLinearScale) {
        return [];
    }

    const barMaxWidth = get(seriesOptions, 'waterfall.barMaxWidth');
    const barPadding = get(seriesOptions, 'waterfall.barPadding');

    const flattenData = series.reduce<DataItem[]>((acc, s) => {
        acc.push(...s.data.map((d) => ({data: d, series: s})));
        return acc;
    }, []);
    const data: DataItem[] = sortBy<DataItem>(flattenData, (d) => d.data.index);

    const bandWidth = getBandWidth({
        series,
        xAxis,
        xScale,
    });
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(MIN_BAR_WIDTH, Math.min(bandWidth - rectGap, barMaxWidth));
    const yZero =
        getYValue({
            point: {y: 0},
            yScale: yLinearScale,
            yAxis,
        }) ?? 0;

    let totalValue = 0;
    const result: PreparedWaterfallData[] = [];
    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (typeof item.data.y !== 'number' && !item.data.total) {
            continue;
        }

        if (!item.data.total) {
            totalValue += Number(item.data.y);
        }

        const prevPoint = result[result.length - 1];
        const xCenter = getXValue({point: item.data, xAxis, xScale});
        if (xCenter === null) {
            continue;
        }
        const x = xCenter - rectWidth / 2;
        const yValue = Number(item.data.total ? totalValue : item.data.y);
        const calculatedYValue = getYValue({
            point: {y: Math.abs(yValue)},
            yScale: yLinearScale,
            yAxis,
        });
        if (calculatedYValue === null) {
            continue;
        }
        const height = yZero - calculatedYValue;

        let y;
        if (!prevPoint || item.data.total) {
            y = getYValue({
                point: {
                    y: yValue > 0 ? yValue : 0,
                },
                yScale: yLinearScale,
                yAxis,
            });
        } else if ((prevPoint.data.total ? prevPoint.subTotal : Number(prevPoint.data.y)) < 0) {
            if (Number(item.data.y) > 0) {
                y = prevPoint.y + prevPoint.height - height;
            } else {
                y = prevPoint.y + prevPoint.height;
            }
        } else if (Number(item.data.y) < 0) {
            y = prevPoint.y;
        } else {
            y = prevPoint.y - height;
        }

        if (y === null) {
            continue;
        }

        const preparedData: PreparedWaterfallData = {
            x,
            y,
            width: rectWidth,
            height,
            opacity: get(item.data, 'opacity', null),
            data: item.data,
            series: item.series,
            subTotal: totalValue,
            htmlLabels: [],
            markers: [],
            getHoverMarkers: () => [],
            annotations: [],
        };

        result.push(preparedData);
    }
    await prepareLabels(result, {width: boundsWidth, height: Math.max(...yLinearScale.range())});
    return result;
};
