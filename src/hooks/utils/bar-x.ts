import get from 'lodash/get';

import type {BarXSeries, BarXSeriesData} from '../../types';
import {getDataCategoryValue} from '../../utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {PreparedXAxis} from '../useAxis/types';
import type {PreparedBarXSeries, PreparedSeriesOptions, StackedSeries} from '../useSeries/types';
import {getSeriesStackId} from '../useSeries/utils';

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

export function getBarXLayoutForNumericScale(args: {
    plotWidth: number;
    seriesOptions: PreparedSeriesOptions;
    groupedData: ReturnType<typeof groupBarXDataByXValue>;
}) {
    const {plotWidth, groupedData, seriesOptions} = args;
    const barMaxWidth = get(seriesOptions, 'bar-x.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-x.barPadding');
    const groupPadding = get(seriesOptions, 'bar-x.groupPadding');
    const groups = Object.values(groupedData);
    const maxGroupItemCount = groups.reduce(
        (acc, items) => Math.max(acc, Object.keys(items).length),
        0,
    );
    const bandSize = plotWidth / groups.length;
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const groupSize = bandSize - groupGap;
    const barGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(
        MIN_BAR_WIDTH,
        Math.min((groupSize - barGap) / maxGroupItemCount, barMaxWidth),
    );

    return {bandSize, barGap, barSize};
}
