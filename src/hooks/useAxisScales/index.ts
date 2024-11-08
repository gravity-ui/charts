import React from 'react';

import {extent, scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import {DEFAULT_AXIS_TYPE} from '../../constants';
import type {ChartAxis, ChartAxisType, ChartSeries} from '../../types';
import {
    CHART_SERIES_WITH_VOLUME_ON_Y_AXIS,
    getAxisHeight,
    getDataCategoryValue,
    getDefaultMaxXAxisValue,
    getDomainDataXBySeries,
    getDomainDataYBySeries,
    getOnlyVisibleSeries,
    isAxisRelatedSeries,
    isSeriesWithCategoryValues,
} from '../../utils';
import type {AxisDirection} from '../../utils';
import type {PreparedAxis} from '../useChartOptions/types';
import type {PreparedSeries} from '../useSeries/types';
import type {PreparedSplit} from '../useSplit/types';

export type ChartScale =
    | ScaleLinear<number, number>
    | ScaleBand<string>
    | ScaleTime<number, number>;

type Args = {
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    xAxis: PreparedAxis;
    yAxis: PreparedAxis[];
    split: PreparedSplit;
};

type ReturnValue = {
    xScale?: ChartScale;
    yScale?: ChartScale[];
};

const isNumericalArrayData = (data: unknown[]): data is number[] => {
    return data.every((d) => typeof d === 'number' || d === null);
};

const filterCategoriesByVisibleSeries = (args: {
    axisDirection: AxisDirection;
    categories: string[];
    series: (PreparedSeries | ChartSeries)[];
}) => {
    const {axisDirection, categories, series} = args;

    const visibleCategories = new Set();
    series.forEach((s) => {
        if (isSeriesWithCategoryValues(s)) {
            s.data.forEach((d) => {
                visibleCategories.add(getDataCategoryValue({axisDirection, categories, data: d}));
            });
        }
    });

    return categories.filter((c) => visibleCategories.has(c));
};

export function createYScale(axis: PreparedAxis, series: PreparedSeries[], boundsHeight: number) {
    const yType: ChartAxisType = get(axis, 'type', DEFAULT_AXIS_TYPE);
    const yMin = get(axis, 'min');
    const yCategories = get(axis, 'categories');
    const yTimestamps = get(axis, 'timestamps');

    switch (yType) {
        case 'linear':
        case 'logarithmic': {
            const domain = getDomainDataYBySeries(series);
            const range = [boundsHeight, boundsHeight * axis.maxPadding];

            if (isNumericalArrayData(domain)) {
                const [domainYMin, domainMax] = extent(domain) as [number, number];
                const yMinValue = typeof yMin === 'number' ? yMin : domainYMin;
                let yMaxValue = domainMax;
                if (series.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type))) {
                    yMaxValue = Math.max(yMaxValue, 0);
                }

                const scaleFn = yType === 'logarithmic' ? scaleLog : scaleLinear;
                return scaleFn().domain([yMinValue, yMaxValue]).range(range).nice();
            }

            break;
        }
        case 'category': {
            if (yCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'y',
                    categories: yCategories,
                    series: series,
                });
                return scaleBand().domain(filteredCategories).range([boundsHeight, 0]);
            }

            break;
        }
        case 'datetime': {
            const range = [boundsHeight, boundsHeight * axis.maxPadding];

            if (yTimestamps) {
                const [yMin, yMax] = extent(yTimestamps) as [number, number];
                return scaleUtc().domain([yMin, yMax]).range(range).nice();
            } else {
                const domain = getDomainDataYBySeries(series);

                if (isNumericalArrayData(domain)) {
                    const [yMin, yMax] = extent(domain) as [number, number];
                    return scaleUtc().domain([yMin, yMax]).range(range).nice();
                }
            }

            break;
        }
    }

    throw new Error('Failed to create yScale');
}

function calculateXAxisPadding(series: (PreparedSeries | ChartSeries)[]) {
    let result = 0;

    series.forEach((s) => {
        switch (s.type) {
            case 'bar-y': {
                // Since labels can be located to the right of the bar, need to add an additional space
                const inside = get(s, 'dataLabels.inside');
                if (!inside) {
                    const labelsMaxWidth = get(s, 'dataLabels.maxWidth', 0);
                    result = Math.max(result, labelsMaxWidth);
                }

                break;
            }
        }
    });

    return result;
}

export function createXScale(
    axis: PreparedAxis | ChartAxis,
    series: (PreparedSeries | ChartSeries)[],
    boundsWidth: number,
) {
    const xMin = get(axis, 'min');
    const xMax = getDefaultMaxXAxisValue(series);
    const xType: ChartAxisType = get(axis, 'type', DEFAULT_AXIS_TYPE);
    const xCategories = get(axis, 'categories');
    const xTimestamps = get(axis, 'timestamps');
    const maxPadding = get(axis, 'maxPadding', 0);

    const xAxisMinPadding = boundsWidth * maxPadding + calculateXAxisPadding(series);
    const xRange = [0, boundsWidth - xAxisMinPadding];

    switch (xType) {
        case 'linear':
        case 'logarithmic': {
            const domain = getDomainDataXBySeries(series);

            if (isNumericalArrayData(domain)) {
                const [domainXMin, domainXMax] = extent(domain) as [number, number];
                const xMinValue = typeof xMin === 'number' ? xMin : domainXMin;
                const xMaxValue =
                    typeof xMax === 'number' ? Math.max(xMax, domainXMax) : domainXMax;

                const scaleFn = xType === 'logarithmic' ? scaleLog : scaleLinear;
                return scaleFn().domain([xMinValue, xMaxValue]).range(xRange).nice();
            }

            break;
        }
        case 'category': {
            if (xCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'x',
                    categories: xCategories,
                    series: series,
                });
                const xScale = scaleBand().domain(filteredCategories).range([0, boundsWidth]);

                if (xScale.step() / 2 < xAxisMinPadding) {
                    xScale.range(xRange);
                }

                return xScale;
            }

            break;
        }
        case 'datetime': {
            if (xTimestamps) {
                const [xMin, xMax] = extent(xTimestamps) as [number, number];
                return scaleUtc().domain([xMin, xMax]).range(xRange).nice();
            } else {
                const domain = getDomainDataXBySeries(series);

                if (isNumericalArrayData(domain)) {
                    const [xMin, xMax] = extent(domain) as [number, number];
                    return scaleUtc().domain([xMin, xMax]).range(xRange).nice();
                }
            }

            break;
        }
    }

    throw new Error('Failed to create xScale');
}

const createScales = (args: Args) => {
    const {boundsWidth, boundsHeight, series, xAxis, yAxis, split} = args;
    let visibleSeries = getOnlyVisibleSeries(series);
    // Reassign to all series in case of all series unselected,
    // otherwise we will get an empty space without grid
    visibleSeries = visibleSeries.length === 0 ? series : visibleSeries;

    return {
        xScale: createXScale(xAxis, visibleSeries, boundsWidth),
        yScale: yAxis.map((axis, index) => {
            const axisSeries = series.filter((s) => {
                const seriesAxisIndex = get(s, 'yAxis', 0);
                return seriesAxisIndex === index;
            });
            const visibleAxisSeries = getOnlyVisibleSeries(axisSeries);
            const axisHeight = getAxisHeight({boundsHeight, split});
            return createYScale(
                axis,
                visibleAxisSeries.length ? visibleAxisSeries : axisSeries,
                axisHeight,
            );
        }),
    };
};

/**
 * Uses to create scales for axis related series
 */
export const useAxisScales = (args: Args): ReturnValue => {
    const {boundsWidth, boundsHeight, series, xAxis, yAxis, split} = args;
    return React.useMemo(() => {
        let xScale: ChartScale | undefined;
        let yScale: ChartScale[] | undefined;
        const hasAxisRelatedSeries = series.some(isAxisRelatedSeries);

        if (hasAxisRelatedSeries) {
            ({xScale, yScale} = createScales({
                boundsWidth,
                boundsHeight,
                series,
                xAxis,
                yAxis,
                split,
            }));
        }

        return {xScale, yScale};
    }, [boundsWidth, boundsHeight, series, xAxis, yAxis, split]);
};
