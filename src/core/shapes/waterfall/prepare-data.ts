import {group} from 'd3-array';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
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
import {getXValue, getYValue} from '../../shapes/utils';
import {isPointDataLabelEnabled} from '../../utils';
import {getFormattedValue} from '../../utils/format';
import {placeRectLabel} from '../../utils/rect-label-placement';
import {measureSvgDataLabels} from '../data-labels';

import type {PreparedWaterfallData} from './types';

interface PlotSize {
    width: number;
    height: number;
}

interface LabelCandidate {
    column: PreparedWaterfallData;
    text: string;
    value: number;
}

function getLabelData(
    {column, text, value}: LabelCandidate,
    bounds: DOMRectReadOnly,
    plot: PlotSize,
): LabelData | undefined {
    const {padding, style, placement, placementFallback} = column.series.dataLabels;
    const {width, height, x: offsetX, y: offsetY} = bounds;
    const labelAbove = value > 0 || (column.data.total && value === 0);
    const size = {width, height};
    const label = {text, style, size, textAnchor: 'middle' as const, series: column.series};

    if (placement) {
        const position = placeRectLabel({
            anchor: column,
            bounds: {x: 0, y: 0, ...plot},
            size,
            axis: 'y',
            endAtMax: !labelAbove,
            padding,
            positions: placement,
            fallback: placementFallback,
        });
        if (!position) return undefined;

        return {
            ...label,
            x: position.x - offsetX,
            y: position.y - offsetY,
        };
    }

    const left = Math.max(0, Math.min(plot.width - width, column.x + column.width / 2 + offsetX));
    return {
        ...label,
        x: left - offsetX,
        y: labelAbove
            ? Math.max(height, column.y - padding)
            : Math.min(plot.height - padding, column.y + column.height + padding + height),
    };
}

async function prepareLabels(data: PreparedWaterfallData[], plot: PlotSize) {
    if (plot.width <= 0 || plot.height <= 0) return;

    const candidates: LabelCandidate[] = [];
    for (const column of data) {
        const intersectsX = column.x < plot.width && column.x + column.width > 0;
        const intersectsY =
            column.height === 0
                ? column.y >= 0 && column.y <= plot.height
                : column.height > 0 && column.y < plot.height && column.y + column.height > 0;
        if (!intersectsX || !intersectsY || !isPointDataLabelEnabled(column)) continue;

        const value = column.data.total ? column.subTotal : Number(column.data.y);
        const text = getFormattedValue({
            value: column.data.label ?? value,
            format: column.series.dataLabels.format,
        });
        candidates.push({column, text, value});
    }

    const byStyle = group(
        candidates,
        ({column}) => column.series.dataLabels.style,
        ({text}) => text,
    );
    for (const [style, byText] of byStyle) {
        const bounds = await measureSvgDataLabels(
            Array.from(byText.keys(), (text) => ({text, style, textAnchor: 'middle'})),
        );
        Array.from(byText.values()).forEach((items, index) => {
            for (const candidate of items) {
                candidate.column.label = getLabelData(candidate, bounds[index], plot);
            }
        });
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
