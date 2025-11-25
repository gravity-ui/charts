import {ascending, descending, max, sort} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {BarXSeriesData, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../../constants';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedBarXSeries, PreparedSeriesOptions} from '../../useSeries/types';
import type {PreparedSplit} from '../../useSplit/types';

import type {PreparedBarXData} from './types';

/**
 * BarX always filters out data with null or replace null by zero.
 */
type PreparedBarXSeriesData = BarXSeriesData & {y?: number | string};

const isSeriesDataValid = (
    d: BarXSeriesData | PreparedBarXSeriesData,
): d is PreparedBarXSeriesData => d.y !== null;

async function getLabelData(d: PreparedBarXData): Promise<LabelData | undefined> {
    if (!d.series.dataLabels.enabled) {
        return undefined;
    }

    const text = getFormattedValue({
        value: d.data.label || d.data.y,
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

    const x = d.x + d.width / 2;
    return {
        text,
        x: html ? x - width / 2 : x,
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

// eslint-disable-next-line complexity
export const prepareBarXData = async (args: {
    series: PreparedBarXSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    boundsHeight: number;
    split: PreparedSplit;
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
    } = args;
    const stackGap: number = seriesOptions['bar-x'].stackGap;
    const categories = get(xAxis, 'categories', [] as string[]);
    const barMaxWidth = get(seriesOptions, 'bar-x.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-x.barPadding');
    const groupPadding = get(seriesOptions, 'bar-x.groupPadding');
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
            const xValue =
                xAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: d})
                    : d.x;

            if (xValue) {
                if (!data[xValue]) {
                    data[xValue] = {};
                }

                const xGroup = data[xValue];

                if (!xGroup[s.stackId]) {
                    xGroup[s.stackId] = [];
                }

                xGroup[s.stackId].push({data: d, series: s});
            }
        });
    });

    let bandWidth = Infinity;

    if (xAxis.type === 'category') {
        const xBandScale = xScale as ScaleBand<string>;
        bandWidth = xBandScale.bandwidth();
    } else {
        const xLinearScale = xScale as ScaleLinear<number, number> | ScaleTime<number, number>;
        const xValues = series.reduce<number[]>((acc, s) => {
            s.data.forEach((dataItem) => acc.push(Number(dataItem.x)));
            return acc;
        }, []);

        xValues.sort().forEach((xValue, index) => {
            if (index > 0 && xValue !== xValues[index - 1]) {
                const dist = xLinearScale(xValue) - xLinearScale(xValues[index - 1]);
                if (dist < bandWidth) {
                    bandWidth = dist;
                }
            }
        });
    }

    const result: PreparedBarXData[] = [];

    const plotIndexes = Array.from(dataByPlots.keys());
    for (let plotDataIndex = 0; plotDataIndex < plotIndexes.length; plotDataIndex++) {
        const data = dataByPlots.get(plotIndexes[plotDataIndex]) ?? {};
        const maxGroupSize = max(Object.values(data), (d) => Object.values(d).length) || 1;
        const groupGap = Math.max(bandWidth * groupPadding, MIN_BAR_GROUP_GAP);
        const groupWidth = bandWidth - groupGap;
        const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
        const rectWidth = Math.max(
            MIN_BAR_WIDTH,
            Math.min(groupWidth / maxGroupSize - rectGap, barMaxWidth),
        );

        const groupedData = Object.entries(data);
        for (let groupedDataIndex = 0; groupedDataIndex < groupedData.length; groupedDataIndex++) {
            const [xValue, val] = groupedData[groupedDataIndex];
            const stacks = Object.values(val);
            const currentGroupWidth = rectWidth * stacks.length + rectGap * (stacks.length - 1);

            for (let groupItemIndex = 0; groupItemIndex < stacks.length; groupItemIndex++) {
                const yValues = stacks[groupItemIndex];
                let stackHeight = 0;
                const stackItems: PreparedBarXData[] = [];
                const sortedData = sortKey
                    ? sort(yValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                    : yValues;

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

                        xCenter = (xBandScale(xValue as string) || 0) + xBandScale.bandwidth() / 2;
                    } else {
                        const xLinearScale = xScale as
                            | ScaleLinear<number, number>
                            | ScaleTime<number, number>;
                        xCenter = xLinearScale(Number(xValue));
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
                        y: yAxisTop + (yDataValue > 0 ? y - stackHeight : base),
                        width: rectWidth,
                        height: shapeHeight,
                        opacity: get(yValue.data, 'opacity', null),
                        data: yValue.data,
                        series: yValue.series,
                        htmlElements: [],
                        isLastStackItem,
                    };

                    stackItems.push(barData);

                    stackHeight += height;
                }

                if (series.some((s) => s.stacking === 'percent')) {
                    let acc = 0;
                    const ratio = plotHeight / (stackHeight - stackItems.length);
                    stackItems.forEach((item) => {
                        item.height = item.height * ratio;
                        item.y = plotHeight - item.height - acc;

                        acc += item.height + 1;
                    });
                }

                result.push(...stackItems);
            }
        }
    }

    for (let i = 0; i < result.length; i++) {
        const barData = result[i];

        if (barData.series.dataLabels.enabled) {
            const label = await getLabelData(barData);
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
