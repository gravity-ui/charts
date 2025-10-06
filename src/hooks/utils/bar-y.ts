import {max} from 'd3';
import type {ScaleBand} from 'd3';
import get from 'lodash/get';

import type {BarYSeries, BarYSeriesData} from '../../types';
import {getDataCategoryValue} from '../../utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {ChartScale} from '../useAxisScales';
import type {PreparedAxis} from '../useChartOptions/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../useSeries/types';

export function groupBarYDataByYValue(series: PreparedBarYSeries[], yAxis: PreparedAxis[]) {
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

export function getBarYLayoutForNumericScale(args: {
    plotHeight: number;
    series: (BarYSeries | PreparedBarYSeries)[];
    seriesOptions: PreparedSeriesOptions;
}) {
    const {plotHeight, series, seriesOptions} = args;
    const barMaxWidth = get(seriesOptions, 'bar-y.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-y.barPadding');
    const groupPadding = get(seriesOptions, 'bar-y.groupPadding');
    let yValuesWithoutStacking = 0;
    const yValuesByStackingIdMap: Record<string, Set<number>> = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
            if (s.stackId) {
                if (!yValuesByStackingIdMap[s.stackId]) {
                    yValuesByStackingIdMap[s.stackId] = new Set();
                }

                yValuesByStackingIdMap[s.stackId].add(Number(d.y));
            } else {
                yValuesWithoutStacking += 1;
            }
        });
    });

    const stackedSeriesLength = Object.values(yValuesByStackingIdMap).reduce(
        (acc, set) => acc + set.size,
        0,
    );
    const dataLength = yValuesWithoutStacking + stackedSeriesLength;
    const bandSize = plotHeight / dataLength;
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const groupSize = bandSize - groupGap;
    const barGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(MIN_BAR_WIDTH, Math.min(groupSize - barGap, barMaxWidth));

    return {bandSize, barGap, barSize, dataLength};
}

export function getBarYLayoutForCategoryScale(args: {
    groupedData: ReturnType<typeof groupBarYDataByYValue>;
    seriesOptions: PreparedSeriesOptions;
    yScale: ChartScale;
}) {
    const {groupedData, seriesOptions, yScale} = args;
    const barMaxWidth = get(seriesOptions, 'bar-y.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-y.barPadding');
    const groupPadding = get(seriesOptions, 'bar-y.groupPadding');
    const bandSize = (yScale as ScaleBand<string>).bandwidth();
    const maxGroupSize = max(Object.values(groupedData), (d) => Object.values(d).length) || 1;
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const groupSize = bandSize - groupGap;
    const barGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupSize / maxGroupSize - barGap, barMaxWidth),
    );

    return {bandSize, barGap, barSize};
}
