import {sort} from 'd3';
import {isEmpty} from 'lodash';
import get from 'lodash/get';

import {SeriesType} from '../../../constants';
import {getAxisCategories} from '../../../hooks/useChartOptions/utils';
import type {ChartAxis, ChartSeries} from '../../../types';

function applyAxisCategoriesOrder<T extends ChartSeries>({
    series,
    axis,
    key,
}: {
    series: T;
    axis: ChartAxis | undefined;
    key: string;
}): T {
    const originalCategories = axis?.categories ?? [];

    if (isEmpty(originalCategories)) {
        return series;
    }

    const axisCategories = getAxisCategories(axis) ?? [];
    const order = Object.fromEntries(axisCategories.map((value, index) => [value, index]));

    const newSeriesData = series.data.map((d) => {
        const value = get(d, key);
        if (typeof value === 'number') {
            return {
                ...d,
                [key]: order[originalCategories[value]],
            };
        }
        return d;
    });

    return {
        ...series,
        data: newSeriesData,
    };
}

export function getSortedSeriesData({
    seriesData,
    yAxes,
    xAxis,
}: {
    seriesData: ChartSeries[];
    yAxes?: ChartAxis[];
    xAxis?: ChartAxis;
}) {
    return seriesData.map((s) => {
        const yAxis = yAxes?.[0];

        let sortedSeries = s;

        sortedSeries = applyAxisCategoriesOrder({series: sortedSeries, axis: yAxis, key: 'y'});
        sortedSeries = applyAxisCategoriesOrder({series: sortedSeries, axis: xAxis, key: 'x'});

        switch (sortedSeries.type) {
            case SeriesType.Area: {
                sortedSeries = {
                    ...sortedSeries,
                    data: sort(sortedSeries.data, (d) => d.x),
                };
                break;
            }
        }

        return sortedSeries;
    });
}
