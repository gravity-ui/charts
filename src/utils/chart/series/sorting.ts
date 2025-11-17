import {sort} from 'd3';
import {isEmpty} from 'lodash';
import get from 'lodash/get';

import {SeriesType} from '../../../constants';
import {getAxisCategories} from '../../../hooks/useChartOptions/utils';
import type {ChartAxis, ChartSeries, ChartSeriesData} from '../../../types';

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

    const newSeriesData = series.data.reduce<ChartSeriesData[]>((acc, d) => {
        const value = get(d, key);
        let newData: ChartSeriesData | undefined;

        if (typeof value === 'number') {
            const newOrder = order[originalCategories[value]];

            // newOrder can be undefined when the number of categories in originalCategories and axisCategories
            // don't match due to min/max constraints applied to the corresponding axis
            if (newOrder !== undefined) {
                newData = {...d, [key]: newOrder};
            }
        } else {
            newData = d;
        }

        if (newData !== undefined) {
            acc.push(newData);
        }

        return acc;
    }, []);

    return {
        ...series,
        data: newSeriesData,
    };
}

export function getSortedSeriesData({
    seriesData,
    xAxis,
    yAxis,
}: {
    seriesData: ChartSeries[];
    xAxis?: ChartAxis;
    yAxis?: ChartAxis[];
}) {
    return seriesData.map((s) => {
        const yAxisItem = yAxis?.[0];

        let sortedSeries = s;

        sortedSeries = applyAxisCategoriesOrder({series: sortedSeries, axis: yAxisItem, key: 'y'});
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
