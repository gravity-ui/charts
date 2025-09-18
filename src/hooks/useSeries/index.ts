import React from 'react';

import {group, scaleOrdinal} from 'd3';

import type {ChartData} from '../../types';
import {getSeriesNames} from '../../utils';
import type {PreparedAxis, PreparedChart} from '../useChartOptions/types';
import {usePrevious} from '../usePrevious';

import {getLegendComponents, getPreparedLegend} from './prepare-legend';
import {getPreparedOptions} from './prepare-options';
import {prepareSeries} from './prepareSeries';
import type {OnLegendItemClick, PreparedLegend, PreparedSeries} from './types';
import {getActiveLegendItems, getAllLegendItems} from './utils';

type Args = {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    colors: string[];
    legend: ChartData['legend'];
    originalSeriesData: ChartData['series']['data'];
    seriesData: ChartData['series']['data'];
    seriesOptions: ChartData['series']['options'];
    preparedYAxis: PreparedAxis[];
};

export const useSeries = (args: Args) => {
    const {
        chartWidth,
        chartHeight,
        chartMargin,
        legend,
        originalSeriesData,
        preparedYAxis,
        seriesData,
        seriesOptions,
        colors,
    } = args;

    const [preparedLegend, setPreparedLegend] = React.useState<PreparedLegend | null>(null);
    React.useEffect(() => {
        getPreparedLegend({legend, series: seriesData}).then((value) => setPreparedLegend(value));
    }, [legend, seriesData]);

    const [preparedSeries, setPreparedSeries] = React.useState<PreparedSeries[]>([]);
    const [activeLegendItems, setActiveLegendItems] = React.useState(
        getActiveLegendItems(preparedSeries),
    );

    React.useEffect(() => {
        (async () => {
            const seriesNames = getSeriesNames(seriesData);
            const colorScale = scaleOrdinal(seriesNames, colors);
            const groupedSeries = group(seriesData, (item) => item.type);

            const acc: PreparedSeries[] = [];

            if (!preparedLegend) {
                return;
            }

            const list = Array.from(groupedSeries);
            for (let i = 0; i < list.length; i++) {
                const [seriesType, seriesList] = list[i];
                acc.push(
                    ...(await prepareSeries({
                        type: seriesType,
                        series: seriesList,
                        seriesOptions,
                        legend: preparedLegend,
                        colorScale,
                        colors,
                    })),
                );
            }

            setPreparedSeries(acc);
            setActiveLegendItems(getActiveLegendItems(acc));
        })();
    }, [seriesData, seriesOptions, preparedLegend, colors]);

    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(seriesOptions);
    }, [seriesOptions]);

    const prevOriginalSeriesData = usePrevious(originalSeriesData);
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
        if (!preparedLegend) {
            return {legendConfig: undefined, legendItems: []};
        }

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

    React.useEffect(() => {
        if (prevOriginalSeriesData !== originalSeriesData) {
            setActiveLegendItems(getActiveLegendItems(preparedSeries));
        }
    }, [originalSeriesData, prevOriginalSeriesData, preparedSeries]);

    return {
        legendItems,
        legendConfig,
        preparedLegend,
        preparedSeries: chartSeries,
        preparedSeriesOptions,
        handleLegendItemClick,
    };
};
