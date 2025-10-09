import {ascending, descending, sort} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {
    getBarYLayoutForCategoryScale,
    getBarYLayoutForNumericScale,
    groupBarYDataByYValue,
} from '../../utils';

import type {PreparedBarYData} from './types';

const DEFAULT_LABEL_PADDING = 7;

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
    const yLinearScale = yScale as ScaleLinear<number, number>;
    const plotHeight = yLinearScale(yLinearScale.domain()[0]);
    const plotWidth = xLinearScale(xLinearScale.domain()[1]);
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
    const {bandSize, barGap, barSize} =
        yAxis[0].type === 'category'
            ? getBarYLayoutForCategoryScale({groupedData, seriesOptions, yScale})
            : getBarYLayoutForNumericScale({
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
            const base = xLinearScale(0 - measureValues[0].series.borderWidth);
            let stackSum = base;

            const stackItems: PreparedBarYData[] = [];
            const sortedData = sortKey
                ? sort(measureValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                : measureValues;
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
                const width = Math.abs(xLinearScale(xValue) - base);

                const item: PreparedBarYData = {
                    x: xValue > baseRangeValue ? stackSum : stackSum - width,
                    y,
                    width,
                    height: barSize,
                    color: data.color || s.color,
                    borderColor: s.borderColor,
                    borderWidth: s.borderWidth,
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
