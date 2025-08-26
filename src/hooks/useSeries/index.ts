import React from 'react';

import {group, scaleOrdinal} from 'd3';

import type {ChartData} from '../../types';
import {getSeriesNames} from '../../utils';
import type {PreparedAxis, PreparedChart} from '../useChartOptions/types';

import {getLegendComponents, getPreparedLegend} from './prepare-legend';
import {getPreparedOptions} from './prepare-options';
import {prepareSeries} from './prepareSeries';
import type {OnLegendItemClick, PreparedSeries} from './types';
import {getActiveLegendItems, getAllLegendItems} from './utils';

type Args = {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    legend: ChartData['legend'];
    series: ChartData['series'];
    preparedYAxis: PreparedAxis[];
    colors: string[];
};

export const useSeries = (args: Args) => {
    const {
        chartWidth,
        chartHeight,
        chartMargin,
        legend,
        preparedYAxis,
        series: {data: series, options: seriesOptions},
        colors,
    } = args;
    const preparedLegend = React.useMemo(
        () => getPreparedLegend({legend, series}),
        [legend, series],
    );
    const preparedSeries = React.useMemo<PreparedSeries[]>(() => {
        const seriesNames = getSeriesNames(series);
        const colorScale = scaleOrdinal(seriesNames, colors);
        const groupedSeries = group(series, (item) => item.type);

        return Array.from(groupedSeries).reduce<PreparedSeries[]>(
            (acc, [seriesType, seriesList]) => {
                acc.push(
                    ...prepareSeries({
                        type: seriesType,
                        series: seriesList,
                        seriesOptions,
                        legend: preparedLegend,
                        colorScale,
                        colors,
                    }),
                );
                return acc;
            },
            [],
        );
    }, [series, seriesOptions, preparedLegend]);
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(seriesOptions);
    }, [seriesOptions]);
    const [activeLegendItems, setActiveLegendItems] = React.useState(
        getActiveLegendItems(preparedSeries),
    );
    const chartSeries = React.useMemo<PreparedSeries[]>(() => {
        return preparedSeries.map((singleSeries) => {
            if (singleSeries.legend.enabled) {
                return {
                    ...singleSeries,
                    visible: activeLegendItems.includes(singleSeries.name),
                };
            }

            return singleSeries;
        });
    }, [preparedSeries, activeLegendItems]);
    const {legendConfig, legendItems} = React.useMemo(() => {
        return getLegendComponents({
            chartHeight,
            chartMargin,
            chartWidth,
            series: chartSeries,
            preparedLegend,
            preparedYAxis,
        });
    }, [chartWidth, chartHeight, chartMargin, chartSeries, preparedLegend, preparedYAxis]);

    const handleLegendItemClick: OnLegendItemClick = React.useCallback(
        ({name, metaKey}) => {
            const allItems = getAllLegendItems(preparedSeries);
            const onlyItemSelected =
                activeLegendItems.length === 1 && activeLegendItems.includes(name);
            let nextActiveLegendItems: string[];

            if (metaKey && activeLegendItems.includes(name)) {
                nextActiveLegendItems = activeLegendItems.filter((item) => item !== name);
            } else if (metaKey && !activeLegendItems.includes(name)) {
                nextActiveLegendItems = activeLegendItems.concat(name);
            } else if (onlyItemSelected && allItems.length === 1) {
                nextActiveLegendItems = [];
            } else if (onlyItemSelected) {
                nextActiveLegendItems = allItems;
            } else {
                nextActiveLegendItems = [name];
            }

            setActiveLegendItems(nextActiveLegendItems);
        },
        [preparedSeries, activeLegendItems],
    );

    // FIXME: remove effect. It initiates extra rerender
    React.useEffect(() => {
        setActiveLegendItems(getActiveLegendItems(preparedSeries));
    }, [preparedSeries]);

    return {
        legendItems,
        legendConfig,
        preparedLegend,
        preparedSeries: chartSeries,
        preparedSeriesOptions,
        handleLegendItemClick,
    };
};
