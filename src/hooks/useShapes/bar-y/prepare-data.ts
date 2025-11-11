import {ascending, descending, sort} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {HtmlItem, LabelData} from '../../../types';
import {
    filterOverlappingLabels,
    getHtmlLabelConstraintedPosition,
    getLabelsSize,
    getSvgLabelConstraintedPosition,
    getTextSizeFn,
} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {getBarYLayout, groupBarYDataByYValue} from '../../utils';

import type {BarYShapesArgs, PreparedBarYData} from './types';

const DEFAULT_LABEL_PADDING = 7;

export async function prepareBarYData(args: {
    boundsHeight: number;
    boundsWidth: number;
    series: PreparedBarYSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<BarYShapesArgs> {
    const {
        boundsHeight,
        boundsWidth,
        series,
        seriesOptions,
        yAxis,
        xScale,
        yScale: [yScale],
    } = args;

    const stackGap = seriesOptions['bar-y'].stackGap;
    const xLinearScale = xScale as ScaleLinear<number, number>;
    const yLinearScale = yScale as ScaleLinear<number, number> | undefined;
    const [xRangeStart, xRangeEnd] = xLinearScale.range();
    const xRangeMin = Math.min(xRangeStart, xRangeEnd);
    const xRangeMax = Math.max(xRangeStart, xRangeEnd);

    if (!yLinearScale) {
        return {
            shapes: [],
            labels: [],
            htmlElements: [],
        };
    }

    const yScaleRange = yLinearScale.range();
    const sortingOptions = get(seriesOptions, 'bar-y.dataSorting');
    const comparator = sortingOptions?.direction === 'desc' ? descending : ascending;
    const sortKey = (() => {
        switch (sortingOptions?.key) {
            case 'x': {
                return 'data.x';
            }
            case 'name': {
                return 'series.name';
            }
            default: {
                return undefined;
            }
        }
    })();

    const groupedData = groupBarYDataByYValue(series, yAxis);
    const plotHeight = Math.abs(yScaleRange[0] - yScaleRange[1]);
    const {bandSize, barGap, barSize} = getBarYLayout({
        groupedData,
        seriesOptions,
        plotHeight,
        scale: yScale,
    });

    const result: PreparedBarYData[] = [];
    const baseRangeValue = xRangeStart;
    Object.entries(groupedData).forEach(([yValue, val]) => {
        const stacks = Object.values(val);
        const currentBarHeight = barSize * stacks.length + barGap * (stacks.length - 1);
        stacks.forEach((measureValues, groupItemIndex) => {
            const base = xLinearScale(0) - measureValues[0].series.borderWidth;
            let stackSum = base;

            const stackItems: PreparedBarYData[] = [];
            const sortedData = sortKey
                ? sort(measureValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                : measureValues;

            let ratio = 1;
            if (series.some((s) => s.stacking === 'percent')) {
                const sum = sortedData.reduce((acc, item) => {
                    if (item.data.x) {
                        return acc + xLinearScale(Number(item.data.x));
                    }
                    return acc;
                }, 0);

                ratio = xLinearScale.range()[1] / sum;
            }

            sortedData.forEach(({data, series: s}, xValueIndex) => {
                if (data.x === null) {
                    return;
                }
                let center;

                if (yAxis[0].type === 'category') {
                    const bandScale = yScale as ScaleBand<string>;
                    const bandScaleDomain = bandScale.domain();

                    if (bandScaleDomain.indexOf(yValue as string) === -1) {
                        return;
                    }

                    center = (bandScale(yValue as string) || 0) + bandSize / 2;
                } else {
                    const scale = yScale as ScaleLinear<number, number> | ScaleTime<number, number>;
                    center = scale(Number(yValue));
                }

                const y = center - currentBarHeight / 2 + (barSize + barGap) * groupItemIndex;
                const xValue = Number(data.x);
                const isLastStackItem = xValueIndex === sortedData.length - 1;
                const width = Math.abs(xLinearScale(xValue) * ratio - base);
                let shapeWidth = width - (stackItems.length ? stackGap : 0);
                if (shapeWidth < 0) {
                    shapeWidth = width;
                }

                if (shapeWidth < 0) {
                    return;
                }

                const itemStackGap = width - shapeWidth;
                const candidateBorderWidth = barSize > s.borderWidth * 2 ? s.borderWidth : 0;
                const isFirstInStack = xValueIndex === 0;
                // Psitive bars grow right from zero, skip left border
                const skipBorderStart = isFirstInStack && xValue > 0;
                // Negative bars grow left from zero, skip right border
                const skipBorderEnd = isFirstInStack && xValue < 0;
                // Calculate position with border compensation
                // Border extends halfBorder outward from the shape, so we need to adjust position
                let itemX = (xValue > baseRangeValue ? stackSum : stackSum - width) + itemStackGap;
                const halfBorder = candidateBorderWidth / 2;

                if (skipBorderStart) {
                    // Positive bar: border extends left, so shift position left by halfBorder
                    // to keep the visual left edge at the zero line
                    itemX -= halfBorder;
                } else if (skipBorderEnd) {
                    // Negative bar: border extends right, so shift position right by halfBorder
                    // to keep the visual right edge at the zero line
                    itemX += halfBorder;
                }

                const item: PreparedBarYData = {
                    x: itemX,
                    y: y,
                    width: shapeWidth,
                    height: barSize,
                    color: data.color || s.color,
                    borderColor: s.borderColor,
                    borderWidth: candidateBorderWidth,
                    opacity: get(data, 'opacity', null),
                    data,
                    series: s,
                    isLastStackItem,
                    skipBorderStart,
                    skipBorderEnd,
                };

                // Check if border touches the plot area edges (not including bars that start from zero)
                if (candidateBorderWidth > 0 && !skipBorderStart && !skipBorderEnd) {
                    const shapeStart = Math.min(item.x, item.x + item.width);
                    const shapeEnd = Math.max(item.x, item.x + item.width);
                    const outerStart = shapeStart - halfBorder;
                    const outerEnd = shapeEnd + halfBorder;
                    // Tolerance in pixels to account for floating point precision when checking edge proximity
                    const edgeTolerance = 0.5;
                    const touchesRangeStart = outerStart - xRangeMin <= edgeTolerance;
                    const touchesRangeEnd = xRangeMax - outerEnd <= edgeTolerance;

                    if (touchesRangeStart || touchesRangeEnd) {
                        item.borderWidth = 0;
                    }
                }

                stackItems.push(item);
                stackSum += width;
            });

            result.push(...stackItems);
        });
    });

    let labels: LabelData[] = [];
    let htmlElements: HtmlItem[] = [];

    const map = new Map();
    for (let i = 0; i < result.length; i++) {
        const prepared = result[i];

        const dataLabels = prepared.series.dataLabels;
        if (dataLabels.enabled) {
            const data = prepared.data;
            const content = getFormattedValue({value: data.label || data.x, ...dataLabels});

            const y = prepared.y + prepared.height / 2;
            if (dataLabels.html) {
                const {maxHeight: height, maxWidth: width} = await getLabelsSize({
                    labels: [content],
                    style: dataLabels.style,
                    html: dataLabels.html,
                });
                const x = dataLabels.inside
                    ? prepared.x + prepared.width / 2 - width / 2
                    : prepared.x + prepared.width + DEFAULT_LABEL_PADDING;
                const constrainedPosition = getHtmlLabelConstraintedPosition({
                    boundsHeight,
                    boundsWidth,
                    height,
                    width,
                    x,
                    y: y - height / 2,
                });

                htmlElements.push({
                    content,
                    size: {width, height},
                    style: dataLabels.style,
                    x: constrainedPosition.x,
                    y: constrainedPosition.y,
                });
            } else {
                if (!map.has(dataLabels.style)) {
                    map.set(dataLabels.style, getTextSizeFn({style: dataLabels.style}));
                }
                const getTextSize = map.get(dataLabels.style);
                const {width, height} = await getTextSize(content);
                const x = dataLabels.inside
                    ? prepared.x + prepared.width / 2 - width / 2
                    : prepared.x + prepared.width + DEFAULT_LABEL_PADDING;
                const constrainedPosition = getSvgLabelConstraintedPosition({
                    boundsHeight,
                    boundsWidth,
                    height,
                    width,
                    x,
                    y: y + height / 2,
                });

                labels.push({
                    size: {width, height},
                    series: prepared.series,
                    style: dataLabels.style,
                    text: content,
                    textAnchor: 'start',
                    x: constrainedPosition.x,
                    y: constrainedPosition.y,
                });
            }
        }
    }

    const allowOverlap = result[0]?.series.dataLabels.allowOverlap;

    if (labels.length && !allowOverlap) {
        labels = filterOverlappingLabels(labels);
    } else if (htmlElements.length && !allowOverlap) {
        htmlElements = filterOverlappingLabels(htmlElements);
    }

    return {
        shapes: result,
        labels,
        htmlElements,
    };
}
