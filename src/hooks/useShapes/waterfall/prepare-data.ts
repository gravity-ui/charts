import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

import type {LabelData} from '../../../types';
import {getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import {MIN_BAR_GAP, MIN_BAR_WIDTH} from '../../constants';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales/types';
import type {
    PreparedSeriesOptions,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {PreparedWaterfallData} from './types';

async function getLabelData(
    d: PreparedWaterfallData,
    plotHeight: number,
): Promise<LabelData | undefined> {
    if (!d.series.dataLabels.enabled) {
        return undefined;
    }

    const labelValue = d.data.label ?? d.data.y ?? d.subTotal;
    const text = getFormattedValue({value: labelValue, ...d.series.dataLabels});
    const style = d.series.dataLabels.style;
    const {maxHeight: height, maxWidth: width} = await getLabelsSize({labels: [text], style});

    let y: number;
    if (Number(d.data.y) > 0 || d.data.total) {
        y = Math.max(height, d.y - d.series.dataLabels.padding);
    } else {
        y = Math.min(
            plotHeight - d.series.dataLabels.padding,
            d.y + d.height + d.series.dataLabels.padding + height,
        );
    }

    return {
        text,
        x: d.x + d.width / 2,
        y,
        style,
        size: {width, height},
        textAnchor: 'middle',
        series: d.series,
    };
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

type DataItem = {data: PreparedWaterfallSeriesData; series: PreparedWaterfallSeries};

export const prepareWaterfallData = async (args: {
    series: PreparedWaterfallSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<PreparedWaterfallData[]> => {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    } = args;
    const yLinearScale = yScale as ScaleLinear<number, number> | undefined;

    if (!yLinearScale) {
        return [];
    }

    const plotHeight = yLinearScale(yLinearScale.domain()[0]);
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

        if (item.data.total) {
            item.data.y = totalValue;
        } else {
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
        } else if (Number(prevPoint.data.y) < 0) {
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
            htmlElements: [],
        };

        preparedData.label = await getLabelData(preparedData, plotHeight);

        result.push(preparedData);
    }
    return result;
};
