import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

import type {LabelData, WaterfallSeriesData} from '../../../types';
import {getLabelsSize} from '../../../utils';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedSeriesOptions, PreparedWaterfallSeries} from '../../useSeries/types';
import {MIN_BAR_GAP, MIN_BAR_WIDTH} from '../constants';
import {getXValue, getYValue} from '../utils';

import type {PreparedWaterfallData} from './types';

function getLabelData(d: PreparedWaterfallData, plotHeight: number): LabelData | undefined {
    if (!d.series.dataLabels.enabled) {
        return undefined;
    }

    const text = String(d.data.label || d.subTotal);
    const style = d.series.dataLabels.style;
    const {maxHeight: height, maxWidth: width} = getLabelsSize({labels: [text], style});

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
    xAxis: PreparedAxis;
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

type DataItem = {data: WaterfallSeriesData; series: PreparedWaterfallSeries};

export const prepareWaterfallData = (args: {
    series: PreparedWaterfallSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
}): PreparedWaterfallData[] => {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    } = args;
    const yLinearScale = yScale as ScaleLinear<number, number>;
    const plotHeight = yLinearScale(yLinearScale.domain()[0]);
    const barMaxWidth = get(seriesOptions, 'waterfall.barMaxWidth');
    const barPadding = get(seriesOptions, 'waterfall.barPadding');

    const flattenData = series.reduce<DataItem[]>((acc, s) => {
        acc.push(...s.data.map((d) => ({data: d, series: s})));
        return acc;
    }, []);
    const data: DataItem[] = sortBy<DataItem>(flattenData, (d) => d.data.x);

    const bandWidth = getBandWidth({
        series,
        xAxis,
        xScale,
    });
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(MIN_BAR_WIDTH, Math.min(bandWidth - rectGap, barMaxWidth));
    const yZero = getYValue({
        point: {y: 0},
        yScale,
        yAxis,
    });

    let totalValue = 0;
    const result: PreparedWaterfallData[] = [];
    data.forEach((item, _index) => {
        if (typeof item.data.y !== 'number' && !item.data.total) {
            return;
        }

        if (!item.data.total) {
            totalValue += Number(item.data.y);
        }

        const prevPoint = result[result.length - 1];
        const xCenter = getXValue({point: item.data, xAxis, xScale});
        const x = xCenter - rectWidth / 2;
        const yValue = Number(item.data.total ? totalValue : item.data.y);
        const height =
            yZero -
            getYValue({
                point: {y: Math.abs(yValue)},
                yScale,
                yAxis,
            });

        let y;
        if (!prevPoint || item.data.total) {
            y = getYValue({
                point: {
                    y: yValue > 0 ? yValue : 0,
                },
                yScale,
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

        preparedData.label = getLabelData(preparedData, plotHeight);

        result.push(preparedData);
    });

    return result;
};
