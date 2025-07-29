import {ascending, descending, max, sort} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import type {BarXSeriesData, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedBarXSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';

import type {PreparedBarXData} from './types';

function getLabelData(d: PreparedBarXData): LabelData | undefined {
    if (!d.series.dataLabels.enabled) {
        return undefined;
    }

    const text = getFormattedValue({
        value: d.data.label || d.data.y,
        ...d.series.dataLabels,
    });
    const style = d.series.dataLabels.style;
    const html = d.series.dataLabels.html;
    const {maxHeight: height, maxWidth: width} = getLabelsSize({
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

export const prepareBarXData = (args: {
    series: PreparedBarXSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
    boundsHeight: number;
}): PreparedBarXData[] => {
    const {series, seriesOptions, xAxis, xScale, yScale, boundsHeight: plotHeight} = args;
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

    const data: Record<
        string | number,
        Record<string, {data: BarXSeriesData; series: PreparedBarXSeries}[]>
    > = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
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

    const maxGroupSize = max(Object.values(data), (d) => Object.values(d).length) || 1;
    const groupGap = Math.max(bandWidth * groupPadding, MIN_BAR_GROUP_GAP);
    const groupWidth = bandWidth - groupGap;
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupWidth / maxGroupSize - rectGap, barMaxWidth),
    );

    const result: PreparedBarXData[] = [];

    Object.entries(data).forEach(([xValue, val]) => {
        const stacks = Object.values(val);
        const currentGroupWidth = rectWidth * stacks.length + rectGap * (stacks.length - 1);
        stacks.forEach((yValues, groupItemIndex) => {
            let stackHeight = 0;
            const stackItems: PreparedBarXData[] = [];

            const sortedData = sortKey
                ? sort(yValues, (a, b) => comparator(get(a, sortKey), get(b, sortKey)))
                : yValues;
            sortedData.forEach((yValue, yValueIndex) => {
                const yAxisIndex = yValue.series.yAxis;
                const seriesYScale = yScale[yAxisIndex] as ScaleLinear<number, number>;
                let xCenter;

                if (xAxis.type === 'category') {
                    const xBandScale = xScale as ScaleBand<string>;
                    xCenter = (xBandScale(xValue as string) || 0) + xBandScale.bandwidth() / 2;
                } else {
                    const xLinearScale = xScale as
                        | ScaleLinear<number, number>
                        | ScaleTime<number, number>;
                    xCenter = xLinearScale(Number(xValue));
                }

                const x = xCenter - currentGroupWidth / 2 + (rectWidth + rectGap) * groupItemIndex;
                const yDataValue = yValue.data.y as number;
                const y = seriesYScale(yDataValue);
                const base = seriesYScale(0);
                const height = yDataValue > 0 ? base - y : y - base;
                const barData: PreparedBarXData = {
                    x,
                    y: yDataValue > 0 ? y - stackHeight : seriesYScale(0),
                    width: rectWidth,
                    height,
                    opacity: get(yValue.data, 'opacity', null),
                    data: yValue.data,
                    series: yValue.series,
                    htmlElements: [],
                    isLastStackItem: yValueIndex === sortedData.length - 1,
                };

                const label = getLabelData(barData);
                if (yValue.series.dataLabels.html && label) {
                    barData.htmlElements.push({
                        x: label.x,
                        y: label.y,
                        content: label.text,
                        size: label.size,
                        style: label.style,
                    });
                } else {
                    barData.label = getLabelData(barData);
                }

                stackItems.push(barData);

                stackHeight += height + 1;
            });

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
        });
    });

    return result;
};
