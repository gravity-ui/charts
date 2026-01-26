import type {AxisDomain, AxisScale} from 'd3';
import {max} from 'd3';
import get from 'lodash/get';

import type {BarXSeries, BarXSeriesData} from '../../types';
import {getDataCategoryValue} from '../../utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {PreparedXAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales/types';
import type {PreparedBarXSeries, PreparedSeriesOptions, StackedSeries} from '../useSeries/types';
import {getSeriesStackId} from '../useSeries/utils';

import {getBandSize} from './get-band-size';

export function groupBarXDataByXValue<T extends BarXSeries | PreparedBarXSeries>(
    series: T[],
    xAxis: PreparedXAxis,
) {
    const data: Record<string | number, Record<string, {data: BarXSeriesData; series: T}[]>> = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
            const categories = xAxis.categories ?? [];
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
            }
        });
    });

    return data;
}

export function getBarXLayout(args: {
    seriesOptions: PreparedSeriesOptions;
    groupedData: ReturnType<typeof groupBarXDataByXValue>;
    scale: ChartScale | undefined;
}) {
    const {groupedData, seriesOptions, scale} = args;
    const barMaxWidth = get(seriesOptions, 'bar-x.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-x.barPadding');
    const groupPadding = get(seriesOptions, 'bar-x.groupPadding');
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
