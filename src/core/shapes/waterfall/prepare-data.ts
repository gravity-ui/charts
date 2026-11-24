import type {AxisDomain, AxisScale} from 'd3-axis';
import get from 'es-toolkit/compat/get';
import sortBy from 'es-toolkit/compat/sortBy';

import type {LabelData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {
    PreparedSeriesOptions,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../series/types';
import {MIN_BAR_GAP, MIN_BAR_WIDTH} from '../../shapes/bar-constants';
import {getXValue, getYValue} from '../../shapes/utils';
import {getLabelsSize, isPointDataLabelEnabled} from '../../utils';
import {getBandSize} from '../../utils/band-size';
import {getFormattedValue} from '../../utils/format';

import type {PreparedWaterfallData, WaterfallInterval} from './types';

async function getLabelData(
    d: PreparedWaterfallData,
    plotHeight: number,
): Promise<LabelData | undefined> {
    if (!isPointDataLabelEnabled({data: d.data, series: d.series})) {
        return undefined;
    }

    const yValue = d.data.total ? d.subTotal : Number(d.data.y);
    const labelValue = d.data.label ?? yValue;
    const text = getFormattedValue({value: labelValue, ...d.series.dataLabels});
    const style = d.series.dataLabels.style;
    const {maxHeight: height, maxWidth: width} = await getLabelsSize({labels: [text], style});

    let y: number;
    if (yValue > 0 || (d.data.total && yValue === 0)) {
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

    const domain =
        xAxis.type === 'category'
            ? xScale.domain()
            : [...new Set(series.flatMap((s) => s.data.map((point) => Number(point.x))))]
                  .filter(Number.isFinite)
                  .sort((a, b) => a - b);
    return getBandSize({domain, scale: xScale as AxisScale<AxisDomain>});
}

interface DataItem {
    data: PreparedWaterfallSeriesData;
    series: PreparedWaterfallSeries;
}

export const prepareWaterfallData = async (args: {
    series: PreparedWaterfallSeries[];
    intervals: ReadonlyMap<PreparedWaterfallSeriesData, WaterfallInterval>;
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
}): Promise<PreparedWaterfallData[]> => {
    const {
        series,
        intervals,
        seriesOptions,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    } = args;
    if (!yScale) {
        return [];
    }

    const [rangeStart, rangeEnd] = yScale.range();
    const plotTop = Math.min(rangeStart, rangeEnd);
    const plotBottom = Math.max(rangeStart, rangeEnd);
    const barMaxWidth = get(seriesOptions, 'waterfall.barMaxWidth');
    const barPadding = get(seriesOptions, 'waterfall.barPadding');

    const data = sortBy<DataItem>(
        series.flatMap((s) => s.data.map((d) => ({data: d, series: s}))),
        (d) => d.data.index,
    );

    const bandWidth = getBandWidth({
        series,
        xAxis,
        xScale,
    });
    const rectGap = Math.max(bandWidth * barPadding, MIN_BAR_GAP);
    const rectWidth = Math.max(MIN_BAR_WIDTH, Math.min(bandWidth - rectGap, barMaxWidth));

    const result: PreparedWaterfallData[] = [];
    for (const item of data) {
        const xCenter = getXValue({point: item.data, xAxis, xScale});
        if (xCenter === null || !Number.isFinite(xCenter)) continue;

        const interval = intervals.get(item.data);
        if (!interval) continue;

        const {start, end, previousIndex} = interval;
        const startY = getYValue({point: {y: start}, yScale, yAxis});
        const endY = getYValue({point: {y: end}, yScale, yAxis});
        if (startY === null || endY === null) continue;

        const y = Math.max(plotTop, Math.min(startY, endY));
        const bottom = Math.min(plotBottom, Math.max(startY, endY));
        if (!Number.isFinite(y) || !Number.isFinite(bottom) || bottom < y) {
            continue;
        }

        const preparedData: PreparedWaterfallData = {
            x: xCenter - rectWidth / 2,
            y,
            width: rectWidth,
            height: bottom - y,
            endY,
            previousIndex,
            opacity: get(item.data, 'opacity', null),
            data: item.data,
            series: item.series,
            subTotal: end,
            htmlLabels: [],
            markers: [],
            getHoverMarkers: () => [],
            annotations: [],
        };

        preparedData.label = await getLabelData(preparedData, plotBottom);

        result.push(preparedData);
    }
    return result;
};
