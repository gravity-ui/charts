import {ascending, descending, max, sort} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {BarYSeriesData, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';

import type {PreparedBarYData} from './types';

const DEFAULT_LABEL_PADDING = 7;

function groupByYValue(series: PreparedBarYSeries[], yAxis: PreparedAxis[]) {
    const data: Record<
        string | number,
        Record<string, {data: BarYSeriesData; series: PreparedBarYSeries}[]>
    > = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
            const axisIndex = get(s, 'yAxis', 0);
            const seriesYAxis = yAxis[axisIndex];
            const categories = get(seriesYAxis, 'categories', [] as string[]);
            const key =
                seriesYAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'y', categories, data: d})
                    : d.y;

            if (key) {
                if (!data[key]) {
                    data[key] = {};
                }

                if (!data[key][s.stackId]) {
                    data[key][s.stackId] = [];
                }

                data[key][s.stackId].push({data: d, series: s});
            }
        });
    });

    return data;
}

function getBandWidth(series: PreparedBarYSeries[], yAxis: PreparedAxis[], yScale: ChartScale) {
    let bandWidth = Infinity;

    if (yAxis[0].type === 'category') {
        bandWidth = (yScale as ScaleBand<string>).bandwidth();
    } else {
        const scale = yScale as ScaleLinear<number, number> | ScaleTime<number, number>;
        const axisValues = series.reduce<number[]>((acc, s) => {
            s.data.forEach((dataItem) => acc.push(Number(dataItem.y)));
            return acc;
        }, []);

        axisValues.sort().forEach((value, index) => {
            if (index > 0 && value !== axisValues[index - 1]) {
                const dist = scale(value) - scale(axisValues[index - 1]);
                if (dist < bandWidth) {
                    bandWidth = dist;
                }
            }
        });
    }

    return bandWidth;
}

async function setLabel(prepared: PreparedBarYData) {
    const dataLabels = prepared.series.dataLabels;
    if (!dataLabels.enabled) {
        return;
    }

    const data = prepared.data;
    const content = getFormattedValue({value: data.label || data.x, ...dataLabels});
    const {maxHeight: height, maxWidth: width} = await getLabelsSize({
        labels: [content],
        style: dataLabels.style,
        html: dataLabels.html,
    });
    const x = dataLabels.inside
        ? prepared.x + prepared.width / 2
        : prepared.x + prepared.width + DEFAULT_LABEL_PADDING;
    const y = prepared.y + prepared.height / 2;

    if (dataLabels.html) {
        prepared.htmlElements.push({
            x,
            y: y - height / 2,
            content,
            size: {width, height},
            style: dataLabels.style,
        });
    } else {
        prepared.label = {
            x,
            y: y + height / 2,
            text: content,
            textAnchor: dataLabels.inside ? 'middle' : 'right',
            style: dataLabels.style,
            series: prepared.series,
            size: {width, height},
        } as LabelData;
    }
}

export const prepareBarYData = async (args: {
    series: PreparedBarYSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
}): Promise<PreparedBarYData[]> => {
    const {
        series,
        seriesOptions,
        yAxis,
        xScale,
        yScale: [yScale],
    } = args;

    const xLinearScale = xScale as ScaleLinear<number, number>;
    const plotWidth = xLinearScale(xLinearScale.domain()[1]);
    const barMaxWidth = get(seriesOptions, 'bar-y.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-y.barPadding');
    const groupPadding = get(seriesOptions, 'bar-y.groupPadding');
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

    const groupedData = groupByYValue(series, yAxis);
    const bandWidth = getBandWidth(series, yAxis, yScale);

    const maxGroupSize = max(Object.values(groupedData), (d) => Object.values(d).length) || 1;
    const groupGap = Math.max(bandWidth * groupPadding, MIN_BAR_GROUP_GAP);
    const groupWidth = bandWidth - groupGap;
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const barHeight = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupWidth / maxGroupSize - rectGap, barMaxWidth),
    );

    const result: PreparedBarYData[] = [];

    Object.entries(groupedData).forEach(([yValue, val]) => {
        const stacks = Object.values(val);
        const currentBarHeight = barHeight * stacks.length + rectGap * (stacks.length - 1);
        stacks.forEach((measureValues, groupItemIndex) => {
            const base = xLinearScale(0);
            let stackSum = base;

            const stackItems: PreparedBarYData[] = [];
            const sortedData = sortKey
                ? sort(measureValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                : measureValues;
            sortedData.forEach(({data, series: s}, xValueIndex) => {
                let center;

                if (yAxis[0].type === 'category') {
                    const bandScale = yScale as ScaleBand<string>;
                    center = (bandScale(yValue as string) || 0) + bandWidth / 2;
                } else {
                    const scale = yScale as ScaleLinear<number, number> | ScaleTime<number, number>;
                    center = scale(Number(yValue));
                }

                const y = center - currentBarHeight / 2 + (barHeight + rectGap) * groupItemIndex;
                const xValue = Number(data.x);
                const width =
                    xValue > 0 ? xLinearScale(xValue) - base : base - xLinearScale(xValue);

                const item: PreparedBarYData = {
                    x: xValue > 0 ? stackSum : stackSum - width,
                    y,
                    width,
                    height: barHeight,
                    color: data.color || s.color,
                    opacity: get(data, 'opacity', null),
                    data,
                    series: s,
                    htmlElements: [],
                    isLastStackItem: xValueIndex === sortedData.length - 1,
                };

                stackItems.push(item);
                stackSum += width + 1;
            });

            if (series.some((s) => s.stacking === 'percent')) {
                let acc = 0;
                const ratio = plotWidth / (stackSum - stackItems.length);
                stackItems.forEach((item) => {
                    item.width = item.width * ratio;
                    item.x = acc;

                    acc += item.width;
                });
            }

            result.push(...stackItems);
        });
    });

    await Promise.all(
        result.map(async (d) => {
            await setLabel(d);
        }),
    );

    return result;
};
