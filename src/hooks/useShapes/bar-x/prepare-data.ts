import {ascending, descending, max, reverse, sort} from 'd3';
import type {AxisDomain, AxisScale, ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {BarXSeriesData, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../../constants';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales/types';
import type {PreparedBarXSeries, PreparedSeriesOptions, StackedSeries} from '../../useSeries/types';
import {getSeriesStackId} from '../../useSeries/utils';
import type {PreparedSplit} from '../../useSplit/types';
import {getBandSize} from '../../utils/get-band-size';

import type {PreparedBarXData} from './types';

/**
 * BarX always filters out data with null or replace null by zero.
 */
type PreparedBarXSeriesData = BarXSeriesData & {y?: number | string};

const isSeriesDataValid = (
    d: BarXSeriesData | PreparedBarXSeriesData,
): d is PreparedBarXSeriesData => d.y !== null;

async function getLabelData(d: PreparedBarXData, xMax: number): Promise<LabelData | undefined> {
    if (!d.series.dataLabels.enabled) {
        return undefined;
    }

    const text = getFormattedValue({
        value: d.data.label ?? d.data.y,
        ...d.series.dataLabels,
    });
    const style = d.series.dataLabels.style;
    const html = d.series.dataLabels.html;
    const {maxHeight: height, maxWidth: width} = await getLabelsSize({
        labels: [text],
        style,
        html,
    });

    let y = Math.max(height, d.y - d.series.dataLabels.padding);
    if (d.series.dataLabels.inside) {
        y = d.y + d.height / 2;
    }

    const centerX = Math.min(xMax - width / 2, Math.max(width / 2, d.x + d.width / 2));
    return {
        text,
        x: html ? centerX - width / 2 : centerX,
        y: html ? y - height : y,
        style,
        size: {width, height},
        textAnchor: 'middle',
        series: d.series,
    };
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
    const stackGap: number = seriesOptions['bar-x'].stackGap;
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

                const stackId = getSeriesStackId(s as StackedSeries);
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
    const rectGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupSize / maxGroupSize - rectGap, barMaxWidth),
    );

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
                let positiveStackHeight = 0;
                let negativeStackHeight = 0;
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
                    const y = seriesYScale(yDataValue);
                    const base = seriesYScale(0);
                    const isLastStackItem = yValueIndex === sortedData.length - 1;
                    const height = Math.abs(base - y);
                    let shapeHeight = height - (stackItems.length ? stackGap : 0);

                    if (shapeHeight < 0) {
                        shapeHeight = height;
                    }

                    if (shapeHeight < 0) {
                        continue;
                    }

                    const barData: PreparedBarXData = {
                        x,
                        y:
                            yDataValue > 0
                                ? yAxisTop + y - positiveStackHeight
                                : yAxisTop + base + negativeStackHeight,
                        width: rectWidth,
                        height: shapeHeight,
                        _height: height,
                        opacity: get(yValue.data, 'opacity', null),
                        data: yValue.data,
                        series: yValue.series,
                        htmlElements: [],
                        isLastStackItem,
                    };

                    stackItems.push(barData);

                    if (yDataValue > 0) {
                        positiveStackHeight += height;
                    } else {
                        negativeStackHeight += height;
                    }
                }

                if (series.some((s) => s.stacking === 'percent')) {
                    let acc = 0;
                    const ratio = plotHeight / positiveStackHeight;
                    stackItems.forEach((item) => {
                        item.height = item._height * ratio;
                        item.y = plotHeight - item.height - acc;

                        acc += item.height + 1;
                    });
                }

                result.push(...stackItems);
            }
        }
    }

    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax;

    for (let i = 0; i < result.length; i++) {
        const barData = result[i];

        const isBarOutsideBounds =
            barData.x + barData.width <= 0 ||
            barData.x >= xMax ||
            barData.y + barData.height <= 0 ||
            barData.y >= plotHeight;
        const isZeroValue = (barData.data.y ?? 0) === 0;
        if (
            barData.series.dataLabels.enabled &&
            !isRangeSlider &&
            (!isBarOutsideBounds || isZeroValue)
        ) {
            const label = await getLabelData(barData, xMax);
            if (barData.series.dataLabels.html && label) {
                barData.htmlElements.push({
                    x: label.x,
                    y: label.y,
                    content: label.text,
                    size: label.size,
                    style: label.style,
                });
            } else {
                barData.label = label;
            }
        }
    }

    return result;
};
