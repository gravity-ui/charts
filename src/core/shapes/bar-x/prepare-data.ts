import {ascending, descending, max, min, reverse, sort} from 'd3-array';
import type {AxisDomain, AxisScale} from 'd3-axis';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
import get from 'lodash/get';

import type {BarXSeriesData, HtmlItem, LabelData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import {prepareAnnotation} from '../../series/prepare-annotation';
import type {PreparedBarXSeries, PreparedSeriesOptions, StackedSeries} from '../../series/types';
import {getSeriesStackId} from '../../series/utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../../shapes/bar-constants';
import {
    getDataCategoryValue,
    getLabelsSize,
    getTextSizeFn,
    isPointDataLabelEnabled,
} from '../../utils';
import {getBandSize} from '../../utils/band-size';
import {getFormattedValue} from '../../utils/format';
import {getPositiveShare} from '../../utils/percentage';

import type {PreparedBarXData} from './types';

/**
 * BarX always filters out data with null or replace null by zero.
 */
type PreparedBarXSeriesData = BarXSeriesData & {y?: number | string};

const isSeriesDataValid = (
    d: BarXSeriesData | PreparedBarXSeriesData,
): d is PreparedBarXSeriesData => d.y !== null;

async function getLabelData(
    d: PreparedBarXData,
    xMax: number,
): Promise<{svgLabel?: LabelData; htmlLabel?: HtmlItem}> {
    const text = getFormattedValue({
        value: d.data.label ?? d.data.y,
        format: d.series.dataLabels.format,
        context: {data: d.data, percentage: d.percentage},
    });
    const style = d.series.dataLabels.style;

    if (d.series.dataLabels.html) {
        const {maxHeight: height, maxWidth: width} = await getLabelsSize({
            labels: [text],
            style,
            html: true,
        });
        let y = Math.max(height, d.y - d.series.dataLabels.padding);
        if (d.series.dataLabels.inside) {
            y = d.y + d.height / 2;
        }
        const centerX = Math.min(xMax - width / 2, Math.max(width / 2, d.x + d.width / 2));
        return {
            htmlLabel: {
                content: text,
                x: centerX - width / 2,
                y: y - height,
                size: {width, height},
                style,
            },
        };
    } else {
        const getTextSize = getTextSizeFn({style});
        const {width, height, hangingOffset} = await getTextSize(text);
        let y = Math.max(hangingOffset, d.y - height + hangingOffset - d.series.dataLabels.padding);
        if (d.series.dataLabels.inside) {
            const centerY = d.y + d.height / 2;
            y = Math.min(
                d.y + d.height - height + hangingOffset,
                centerY - height / 2 + hangingOffset,
            );
        }
        const centerX = Math.min(xMax - width / 2, Math.max(width / 2, d.x + d.width / 2));
        return {
            svgLabel: {
                text,
                x: centerX,
                y,
                style,
                size: {width, height, hangingOffset},
                textAnchor: 'middle',
                series: d.series,
            },
        };
    }
}

type PlotIndex = number;
type XValue = string | number;
type StackId = string;
type GroupedSeries = Map<
    PlotIndex,
    Record<XValue, Record<StackId, {data: PreparedBarXSeriesData; series: PreparedBarXSeries}[]>>
>;

export const prepareBarXData = async (args: {
    series: PreparedBarXSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    boundsHeight: number;
    split: PreparedSplit;
    isRangeSlider?: boolean;
}): Promise<PreparedBarXData[]> => {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight: plotHeight,
        split,
        isRangeSlider,
    } = args;
    const configuredStackGap = seriesOptions['bar-x'].stackGap;
    const stackGap = Number.isFinite(configuredStackGap) ? Math.max(0, configuredStackGap) : 0;
    const categories = xAxis?.categories ?? [];
    const sortingOptions = get(seriesOptions, 'bar-x.dataSorting');
    const comparator = sortingOptions?.direction === 'desc' ? descending : ascending;
    const sortKey = (() => {
        switch (sortingOptions?.key) {
            case 'y': {
                return 'data.y';
            }
            case 'name': {
                return 'series.name';
            }
            default: {
                return undefined;
            }
        }
    })();

    const domain = new Set<string | number>();
    let maxGroupSize = 1;

    // series grouped by plotIndex > xValue > data[];
    const dataByPlots: GroupedSeries = new Map();
    series.forEach((s) => {
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const plotIndex = seriesYAxis.plotIndex;

        if (!dataByPlots.has(plotIndex)) {
            dataByPlots.set(plotIndex, {});
        }
        const data = dataByPlots.get(plotIndex) ?? {};

        s.data.forEach((d) => {
            if (!isSeriesDataValid(d)) {
                return;
            }
            const key =
                xAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: d})
                    : d.x;

            if (key !== undefined) {
                if (!data[key]) {
                    data[key] = {};
                }

                const stackId = JSON.stringify([s.yAxis, getSeriesStackId(s as StackedSeries)]);
                if (!data[key][stackId]) {
                    data[key][stackId] = [];
                }

                data[key][stackId].push({data: d, series: s});
                domain.add(key);
            }
        });

        maxGroupSize = Math.max(
            maxGroupSize,
            max(Object.values(data), (d) => Object.values(d).length) || 1,
        );
    });

    const result: PreparedBarXData[] = [];

    const barMaxWidth = get(seriesOptions, 'bar-x.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-x.barPadding');
    const groupPadding = get(seriesOptions, 'bar-x.groupPadding');
    const bandSize = getBandSize({
        domain: Array.from(domain),
        scale: xScale as AxisScale<AxisDomain>,
    });
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const groupSize = bandSize - groupGap;
    const barSlotSize = groupSize / maxGroupSize;
    const rectGap = Math.max(barSlotSize * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(MIN_BAR_WIDTH, Math.min(barSlotSize - rectGap, barMaxWidth));
    const borderWidthBySeries = new Map(
        series.map((s) => [
            s,
            Number.isFinite(s.borderWidth) && s.borderWidth > 0 && rectWidth > s.borderWidth * 2
                ? s.borderWidth
                : 0,
        ]),
    );
    const positiveExtendsUpByAxis = yScale.map((scale) => {
        const range = scale?.range() ?? [1, 0];
        return range[0] > range[range.length - 1];
    });

    const plotIndexes = Array.from(dataByPlots.keys());
    for (let plotDataIndex = 0; plotDataIndex < plotIndexes.length; plotDataIndex++) {
        const data = dataByPlots.get(plotIndexes[plotDataIndex]) ?? {};
        const groupedData = Object.entries(data);

        for (let groupedDataIndex = 0; groupedDataIndex < groupedData.length; groupedDataIndex++) {
            const [xValue, val] = groupedData[groupedDataIndex];
            const stacks = Object.values(val);
            const currentGroupWidth = rectWidth * stacks.length + rectGap * (stacks.length - 1);

            for (let groupItemIndex = 0; groupItemIndex < stacks.length; groupItemIndex++) {
                const yValues = stacks[groupItemIndex];
                const percentStack = yValues.some((item) => item.series.stacking === 'percent');
                let positiveStackSum = 0;
                let negativeStackSum = 0;
                const stackItems: PreparedBarXData[] = [];

                let sortedData = yValues;
                if (sortKey) {
                    sortedData = sort(yValues, (a, b) =>
                        comparator(get(a, sortKey), get(b, sortKey)),
                    );
                } else if (sortingOptions?.direction === 'desc') {
                    sortedData = reverse(yValues);
                }

                for (let yValueIndex = 0; yValueIndex < sortedData.length; yValueIndex++) {
                    const yValue = sortedData[yValueIndex];
                    const yAxisIndex = yValue.series.yAxis;
                    const seriesYScale = yScale[yAxisIndex] as
                        | ScaleLinear<number, number>
                        | undefined;
                    if (!seriesYScale) {
                        continue;
                    }

                    const seriesYAxis = yAxis[yAxisIndex];
                    const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;

                    let xCenter;

                    if (xAxis.type === 'category') {
                        const xBandScale = xScale as ScaleBand<string>;
                        const xBandScaleDomain = xBandScale.domain();

                        if (xBandScaleDomain.indexOf(xValue as string) === -1) {
                            continue;
                        }

                        xCenter = (xBandScale(xValue as string) || 0) + bandSize / 2;
                    } else {
                        const scale = xScale as
                            | ScaleLinear<number, number>
                            | ScaleTime<number, number>;
                        xCenter = scale(Number(xValue));
                    }

                    const x =
                        xCenter - currentGroupWidth / 2 + (rectWidth + rectGap) * groupItemIndex;

                    const yDataValue = (yValue.data.y ?? 0) as number;

                    const positiveExtendsUp = positiveExtendsUpByAxis[yAxisIndex];
                    let extendsUp = positiveExtendsUp;
                    let shapeHeight = 0;
                    let barPositionY = yAxisTop;
                    if (!percentStack) {
                        const baseValue =
                            seriesYAxis.type === 'logarithmic'
                                ? (min(seriesYScale.domain()) ?? 0)
                                : 0;
                        const stackSum = yDataValue > 0 ? positiveStackSum : negativeStackSum;
                        const startPixel = seriesYScale(stackSum === 0 ? baseValue : stackSum);
                        const endPixel = seriesYScale(stackSum + yDataValue);
                        const height = Math.abs(endPixel - startPixel);
                        const defaultExtendsUp =
                            yDataValue >= 0 ? positiveExtendsUp : !positiveExtendsUp;
                        extendsUp = height > 0 ? endPixel < startPixel : defaultExtendsUp;
                        // Keep the value end fixed; the gap belongs next to the previous
                        // segment of the same sign, including on reversed axes.
                        const itemGap = stackSum !== 0 && height >= stackGap ? stackGap : 0;
                        shapeHeight = height - itemGap;
                        barPositionY =
                            yAxisTop + Math.min(startPixel, endPixel) + (extendsUp ? 0 : itemGap);
                    }

                    const barData: PreparedBarXData = {
                        annotation:
                            yValue.data.annotation && !isRangeSlider
                                ? await prepareAnnotation({
                                      annotation: yValue.data.annotation,
                                      optionsLabel: seriesOptions['bar-x']?.annotation?.label,
                                      optionsPopup: seriesOptions['bar-x']?.annotation?.popup,
                                  })
                                : undefined,
                        annotations: [],
                        x,
                        y: barPositionY,
                        width: rectWidth,
                        height: shapeHeight,
                        borderWidth: borderWidthBySeries.get(yValue.series) ?? 0,
                        opacity: get(yValue.data, 'opacity', null),
                        data: yValue.data,
                        series: yValue.series,
                        htmlLabels: [],
                        svgLabels: [],
                        isLastStackItem: false,
                        extendsUp,
                        markers: [],
                        getHoverMarkers: () => [],
                    };

                    stackItems.push(barData);

                    if (yDataValue > 0) {
                        positiveStackSum += yDataValue;
                    } else {
                        negativeStackSum += yDataValue;
                    }
                }

                if (percentStack) {
                    const currentPlot = split.plots[plotIndexes[plotDataIndex]];
                    const currentPlotHeight = currentPlot?.height ?? plotHeight;
                    const currentPlotTop = currentPlot?.top ?? 0;

                    const visibleCount = stackItems.filter(
                        (item) => Number(item.data.y) > 0,
                    ).length;
                    const gapCount = Math.max(0, visibleCount - 1);
                    const availableHeight = Math.max(0, currentPlotHeight);
                    const gap = gapCount ? Math.min(stackGap, availableHeight / gapCount) : 0;
                    const segmentsHeight = Math.max(0, availableHeight - gap * gapCount);
                    const extendsUp =
                        positiveExtendsUpByAxis[stackItems[0]?.series.yAxis ?? 0] ?? true;
                    let offset = 0;
                    let visibleIndex = 0;
                    stackItems.forEach((item) => {
                        const share = getPositiveShare(Number(item.data.y ?? 0), positiveStackSum);
                        item.percentage = item.series.stacking === 'percent' ? share : undefined;
                        if (share > 0 && visibleIndex > 0) offset += gap;
                        // Snap the final end to the plot edge to avoid floating-point overflow.
                        item.height =
                            share > 0 && visibleIndex === visibleCount - 1
                                ? Math.max(0, availableHeight - offset)
                                : share * segmentsHeight;
                        item.extendsUp = extendsUp;
                        item.y =
                            currentPlotTop +
                            (extendsUp
                                ? Math.max(0, availableHeight - offset - item.height)
                                : offset);
                        offset += item.height;
                        if (share > 0) visibleIndex++;
                    });
                }

                let lastPositiveItem: PreparedBarXData | undefined;
                let lastNegativeItem: PreparedBarXData | undefined;
                for (const item of stackItems) {
                    if (item.height <= 0 || Number(item.data.y) === 0) continue;
                    if (Number(item.data.y) > 0) {
                        lastPositiveItem = item;
                    } else {
                        lastNegativeItem = item;
                    }
                }
                if (lastPositiveItem) lastPositiveItem.isLastStackItem = true;
                if (lastNegativeItem) lastNegativeItem.isLastStackItem = true;

                result.push(...stackItems);
            }
        }
    }

    for (const barData of result) {
        if (barData.annotation) {
            barData.annotations = [
                {
                    annotation: barData.annotation,
                    x: barData.x + barData.width / 2,
                    y: barData.y,
                },
            ];
        }
    }

    const xMax = Math.max(...xScale.range());

    for (let i = 0; i < result.length; i++) {
        const barData = result[i];

        const isBarOutsideBounds =
            barData.x + barData.width <= 0 ||
            barData.x >= xMax ||
            barData.y + barData.height <= 0 ||
            barData.y >= plotHeight;
        const isZeroValue = (barData.data.y ?? 0) === 0;
        if (
            !isRangeSlider &&
            (!isBarOutsideBounds || isZeroValue) &&
            isPointDataLabelEnabled({data: barData.data, series: barData.series})
        ) {
            const {svgLabel, htmlLabel} = await getLabelData(barData, xMax);
            if (svgLabel) {
                barData.svgLabels.push(svgLabel);
            }
            if (htmlLabel) {
                barData.htmlLabels.push(htmlLabel);
            }
        }
    }

    return result;
};
