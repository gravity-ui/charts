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

    if (!yLinearScale) {
        return {
            shapes: [],
            labels: [],
            htmlElements: [],
        };
    }

    const yScaleRange = yLinearScale.range();
    const plotHeight = Math.abs(yScaleRange[0] - yScaleRange[1]);
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
    const {bandSize, barGap, barSize} = getBarYLayout({
        groupedData,
        seriesOptions,
        plotHeight: plotHeight - plotHeight * yAxis[0].maxPadding,
    });

    const result: PreparedBarYData[] = [];
    const baseRangeValue = xLinearScale.range()[0];
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
                let center;

                if (yAxis[0].type === 'category') {
                    const bandScale = yScale as ScaleBand<string>;
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

                if (shapeWidth <= 0) {
                    return;
                }

                const itemStackGap = width - shapeWidth;
                const item: PreparedBarYData = {
                    x: (xValue > baseRangeValue ? stackSum : stackSum - width) + itemStackGap,
                    y: y,
                    width: shapeWidth,
                    height: barSize,
                    color: data.color || s.color,
                    borderColor: s.borderColor,
                    borderWidth: barSize > s.borderWidth * 2 ? s.borderWidth : 0,
                    opacity: get(data, 'opacity', null),
                    data,
                    series: s,
                    isLastStackItem,
                };

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

            const x = dataLabels.inside
                ? prepared.x + prepared.width / 2
                : prepared.x + prepared.width + DEFAULT_LABEL_PADDING;
            const y = prepared.y + prepared.height / 2;

            if (dataLabels.html) {
                const {maxHeight: height, maxWidth: width} = await getLabelsSize({
                    labels: [content],
                    style: dataLabels.style,
                    html: dataLabels.html,
                });
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
                    textAnchor: dataLabels.inside ? 'middle' : 'right',
                    x: constrainedPosition.x,
                    y: constrainedPosition.y,
                } as LabelData);
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
