import {ascending, descending, sort} from 'd3-array';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
import get from 'lodash/get';

import type {HtmlItem, LabelData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../series/types';
import {
    filterOverlappingLabels,
    getHtmlLabelConstraintedPosition,
    getLabelsSize,
    getSvgLabelConstraintedPosition,
    getTextSizeFn,
    isPointDataLabelEnabled,
} from '../../utils';
import {getFormattedValue} from '../../utils/format';
import {getPositiveShare} from '../../utils/percentage';

import {getBarYLayout, groupBarYDataByYValue} from './layout';
import type {BarYShapesArgs, PreparedBarYData} from './types';

export async function prepareBarYData(args: {
    boundsHeight: number;
    boundsWidth: number;
    series: PreparedBarYSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<BarYShapesArgs> {
    const {
        boundsHeight,
        boundsWidth,
        series,
        seriesOptions,
        xAxis,
        yAxis,
        xScale,
        yScale: [yScale],
    } = args;

    const stackGap = seriesOptions['bar-y'].stackGap;
    const xLinearScale = xScale as ScaleLinear<number, number>;
    const yLinearScale = yScale as ScaleLinear<number, number> | undefined;

    if (!yLinearScale) {
        return {
            shapes: [],
            labels: [],
            htmlLabels: [],
            markers: [],
            getHoverMarkers: () => [],
            annotations: [],
        };
    }

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
    const {bandSize, barGap, barSize, overlaySize} = getBarYLayout({
        groupedData,
        seriesOptions,
        scale: yScale,
    });

    const result: PreparedBarYData[] = [];
    Object.entries(groupedData).forEach(([yValue, val]) => {
        const stacks = Object.values(val);
        const groupedCount = stacks.filter(
            (items) => items[0].series.grouping !== false || items[0].series.stacking,
        ).length;
        const currentBarHeight = barSize * groupedCount + barGap * Math.max(0, groupedCount - 1);
        let groupedIndex = 0;
        stacks.forEach((measureValues) => {
            const overlay =
                measureValues[0].series.grouping === false && !measureValues[0].series.stacking;
            const height = overlay ? overlaySize : barSize;
            const slotIndex = overlay ? 0 : groupedIndex++;
            const baseValue = xAxis.type === 'logarithmic' ? 0 : xLinearScale(0);
            const base = overlay ? baseValue : baseValue - measureValues[0].series.borderWidth;
            let positiveStack = base;
            let negativeStack = base;

            const stackItems: PreparedBarYData[] = [];
            const sortedData = sortKey
                ? sort(measureValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                : measureValues;

            let ratio = 1;
            let percentTotal = 0;
            if (measureValues.some((item) => item.series.stacking === 'percent')) {
                let sum = 0;
                for (const item of sortedData) {
                    const value = Number(item.data.x);
                    if (Number.isFinite(value) && value > 0) {
                        percentTotal += value;
                        sum += xLinearScale(value);
                    }
                }

                ratio = sum === 0 ? 0 : xLinearScale.range()[1] / sum;
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

                const y = overlay
                    ? center - height / 2
                    : center - currentBarHeight / 2 + (barSize + barGap) * slotIndex;
                const xValue = Number(data.x);
                const width = Math.abs(xLinearScale(xValue) * ratio - base);
                let shapeWidth = width - (!overlay && stackItems.length ? stackGap : 0);
                if (shapeWidth < 0) {
                    shapeWidth = width;
                }

                if (shapeWidth < 0) {
                    return;
                }

                const itemStackGap = width - shapeWidth;
                const borderWidth =
                    height > s.borderWidth * 2 && (!overlay || shapeWidth > s.borderWidth * 2)
                        ? s.borderWidth
                        : 0;
                const isFirstInStack = xValueIndex === 0;
                const isLastStackItem = overlay || xValueIndex === sortedData.length - 1;
                const extendsRight = xLinearScale(xValue) > baseValue;
                // Calculate position with border compensation
                // Border extends halfBorder outward from the shape, so we need to adjust position
                let itemX = extendsRight ? positiveStack : negativeStack - width;
                if (overlay) itemX = Math.min(base, xLinearScale(xValue));
                itemX += itemStackGap;
                const halfBorder = borderWidth / 2;

                if (!overlay && isFirstInStack && extendsRight) {
                    // Bar extends right from base, border extends outward to the
                    // left → shift left by halfBorder to keep the visual left
                    // edge at the zero line.
                    itemX -= halfBorder;
                } else if (!overlay && isFirstInStack && !extendsRight && xValue !== 0) {
                    // Bar extends left from base, border extends outward to the
                    // right → shift right by halfBorder to keep the visual
                    // right edge at the zero line.
                    itemX += halfBorder;
                }

                const item: PreparedBarYData = {
                    x: itemX,
                    y: y,
                    width: shapeWidth,
                    height,
                    color: data.color || s.color,
                    borderColor: s.borderColor,
                    borderWidth,
                    opacity: data.opacity ?? s.opacity,
                    data,
                    series: s,
                    percentage:
                        s.stacking === 'percent'
                            ? getPositiveShare(xValue, percentTotal)
                            : undefined,
                    isLastStackItem,
                };

                stackItems.push(item);

                if (extendsRight) {
                    positiveStack += width;
                } else {
                    negativeStack -= width;
                }
            });

            result.push(...stackItems);
        });
    });

    if (series.some((s) => s.grouping === false && !s.stacking)) {
        const seriesOrder = new Map(series.map((s, index) => [s, index]));
        result.sort((a, b) => (seriesOrder.get(a.series) ?? 0) - (seriesOrder.get(b.series) ?? 0));
    }

    let labels: LabelData[] = [];
    let htmlLabels: HtmlItem[] = [];

    const map = new Map();
    for (let i = 0; i < result.length; i++) {
        const prepared = result[i];

        const dataLabels = prepared.series.dataLabels;
        if (isPointDataLabelEnabled({data: prepared.data, series: prepared.series})) {
            const data = prepared.data;
            const content = getFormattedValue({
                value: data.label ?? data.x,
                format: dataLabels.format,
                context: {data, percentage: prepared.percentage},
            });

            const y = prepared.y + prepared.height / 2;
            if (dataLabels.html) {
                const {maxHeight: height, maxWidth: width} = await getLabelsSize({
                    labels: [content],
                    style: dataLabels.style,
                    html: dataLabels.html,
                });
                const x = dataLabels.inside
                    ? prepared.x + prepared.width / 2 - width / 2
                    : prepared.x + prepared.width + dataLabels.padding;
                const constrainedPosition = getHtmlLabelConstraintedPosition({
                    boundsHeight,
                    boundsWidth,
                    height,
                    width,
                    x,
                    y: y - height / 2,
                });

                htmlLabels.push({
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
                const {width, height, hangingOffset} = await getTextSize(content);
                const x = dataLabels.inside
                    ? prepared.x + prepared.width / 2 - width / 2
                    : prepared.x + prepared.width + dataLabels.padding;
                const constrainedPosition = getSvgLabelConstraintedPosition({
                    boundsHeight,
                    boundsWidth,
                    height,
                    width,
                    x,
                    y,
                    hangingOffset,
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
    } else if (htmlLabels.length && !allowOverlap) {
        htmlLabels = filterOverlappingLabels(htmlLabels);
    }

    return {
        shapes: result,
        labels,
        htmlLabels,
        markers: [],
        getHoverMarkers: () => [],
        annotations: [],
    };
}
