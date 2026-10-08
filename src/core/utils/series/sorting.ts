import {sort} from 'd3-array';
import {isEmpty} from 'lodash';
import get from 'lodash/get';

import type {ChartAxis, ChartSeries, ChartSeriesData} from '../../../types';
import {SERIES_TYPE} from '../../constants';
import {getAxisCategories} from '../../utils';

const originalSeries = new WeakMap<ChartSeries, ChartSeries>();
const originalSeriesData = new WeakMap<ChartSeriesData, ChartSeriesData>();

export function getOriginalSeries<T extends ChartSeries>(series: T): T {
    return (originalSeries.get(series) ?? series) as T;
}

export function getOriginalSeriesData<T extends ChartSeriesData>(data: T): T {
    return (originalSeriesData.get(data) ?? data) as T;
}

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
    const order = new Map(axisCategories.map((value, index) => [value, index]));

    const newSeriesData = series.data.reduce<ChartSeriesData[]>((acc, d) => {
        const value = get(d, key);
        let newData: ChartSeriesData | undefined;

        if (typeof value === 'number') {
            const newIndex = order.get(originalCategories[value]);

            // newIndex can be undefined when the index is unknown or when the number of categories
            // in originalCategories and axisCategories don't match due to min/max constraints
            // applied to the corresponding axis
            if (newIndex !== undefined) {
                newData = {...d, [key]: newIndex};
                originalSeriesData.set(newData, getOriginalSeriesData(d));
            }
        } else if (typeof value === 'string') {
            // a category name does not depend on the axis order, so the point is kept as is
            // and dropped only when its category is unknown or cut off by min/max
            if (order.has(value)) {
                newData = d;
            }
        } else {
            // points without a value for the key are kept as is
            newData = d;
        }

        if (newData !== undefined) {
            acc.push(newData);
        }

        return acc;
    }, []);

    const normalizedSeries = {
        ...series,
        data: newSeriesData,
    };
    originalSeries.set(normalizedSeries, getOriginalSeries(series));
    return normalizedSeries;
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
        const yAxisIndex: number = get(s, 'yAxis', 0);
        const yAxisItem = yAxis?.[yAxisIndex];

        let sortedSeries = s;

        sortedSeries = applyAxisCategoriesOrder({series: sortedSeries, axis: yAxisItem, key: 'y'});
        sortedSeries = applyAxisCategoriesOrder({series: sortedSeries, axis: xAxis, key: 'x'});

        switch (sortedSeries.type) {
            case SERIES_TYPE.Area: {
                const sourceSeries = getOriginalSeries(sortedSeries);
                sortedSeries = {
                    ...sortedSeries,
                    data: sort(sortedSeries.data, (d) => d.x),
                };
                originalSeries.set(sortedSeries, sourceSeries);
                break;
            }
        }

        return sortedSeries;
    });
}
