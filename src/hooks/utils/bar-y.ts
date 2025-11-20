import type {AxisDomain, AxisScale} from 'd3';
import {max} from 'd3';
import get from 'lodash/get';

import type {BarYSeries, BarYSeriesData} from '../../types';
import {getDataCategoryValue} from '../../utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {PreparedYAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales';
import type {PreparedBarYSeries, PreparedSeriesOptions, StackedSeries} from '../useSeries/types';
import {getSeriesStackId} from '../useSeries/utils';

import {getBandSize} from './get-band-size';

/**
 * BarY always filters out data with null or replace null by zero.
 */
type PreparedBarYSeriesData = BarYSeriesData & {x?: number | string};

const isSeriesDataValid = (
    d: BarYSeriesData | PreparedBarYSeriesData,
): d is PreparedBarYSeriesData => d.x !== null;

export function groupBarYDataByYValue<T extends BarYSeries | PreparedBarYSeries>(
    series: T[],
    yAxis: PreparedYAxis[],
) {
    const data: Record<
        string | number,
        Record<string, {data: PreparedBarYSeriesData; series: T}[]>
    > = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
            if (!isSeriesDataValid(d)) {
                return;
            }
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

                const stackId = getSeriesStackId(s as StackedSeries);
                if (!data[key][stackId]) {
                    data[key][stackId] = [];
                }

                data[key][stackId].push({data: d, series: s});
            }
        });
    });

    return data;
}

export function getBarYLayout(args: {
    plotHeight: number;
    seriesOptions: PreparedSeriesOptions;
    groupedData: ReturnType<typeof groupBarYDataByYValue>;
    scale: ChartScale | undefined;
}) {
    const {groupedData, seriesOptions, scale} = args;
    const barMaxWidth = get(seriesOptions, 'bar-y.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-y.barPadding');
    const groupPadding = get(seriesOptions, 'bar-y.groupPadding');
    const domain = Object.keys(groupedData);
    const bandSize = getBandSize({domain, scale: scale as AxisScale<AxisDomain>});
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const maxGroupSize = max(Object.values(groupedData), (d) => Object.values(d).length) || 1;
    const groupSize = bandSize - groupGap;
    const barGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupSize / maxGroupSize - barGap, barMaxWidth),
    );

    return {bandSize, barGap, barSize};
}
