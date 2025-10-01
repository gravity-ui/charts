import React from 'react';

import {group, scaleOrdinal} from 'd3';

import type {ChartData} from '../../types';
import {getSeriesNames} from '../../utils';
import {usePrevious} from '../usePrevious';

import {getPreparedLegend} from './prepare-legend';
import {prepareSeries} from './prepareSeries';
import type {OnLegendItemClick, PreparedLegend, PreparedSeries} from './types';
import {getActiveLegendItems, getAllLegendItems} from './utils';

type Args = {
    colors: string[];
    legend: ChartData['legend'];
    originalSeriesData: ChartData['series']['data'];
    seriesData: ChartData['series']['data'];
    seriesOptions: ChartData['series']['options'];
    preparedLegend?: PreparedLegend;
};

const useVisibleSeries = ({
    preparedSeries,
    activeLegendItems,
}: {
    preparedSeries: PreparedSeries[];
    activeLegendItems: string[];
}) => {
    return React.useMemo<PreparedSeries[]>(() => {
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
};

const getPreparedSeries = async ({
    seriesData,
    seriesOptions,
    colors,
    preparedLegend,
}: {
    seriesData: ChartData['series']['data'];
    seriesOptions: ChartData['series']['options'];
    colors: string[];
    preparedLegend?: PreparedLegend | null;
}) => {
    const seriesNames = getSeriesNames(seriesData);
    const colorScale = scaleOrdinal(seriesNames, colors);
    const groupedSeries = group(seriesData, (item) => item.type);

    const acc: PreparedSeries[] = [];

    if (!preparedLegend) {
        return acc;
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

    return acc;
};

export const useSeries = (args: Args) => {
    const {
        legend,
        originalSeriesData,
        seriesData,
        seriesOptions,
        colors,
        preparedLegend: preparedLegendProps = null,
    } = args;

    const [preparedLegend, setPreparedLegend] = React.useState<PreparedLegend | null>(
        preparedLegendProps,
    );
    React.useEffect(() => {
        if (!preparedLegendProps) {
            getPreparedLegend({legend, series: seriesData}).then((value) =>
                setPreparedLegend(value),
            );
        }
    }, [legend, preparedLegendProps, seriesData]);

    const [preparedSeries, setPreparedSeries] = React.useState<PreparedSeries[]>([]);
    const [activeLegendItems, setActiveLegendItems] = React.useState(
        getActiveLegendItems(preparedSeries),
    );

    React.useEffect(() => {
        (async () => {
            const items = await getPreparedSeries({
                seriesData,
                seriesOptions,
                preparedLegend,
                colors,
            });

            setPreparedSeries(items);
            setActiveLegendItems(getActiveLegendItems(items));
        })();
    }, [seriesData, seriesOptions, preparedLegend, colors]);

    const prevOriginalSeriesData = usePrevious(originalSeriesData);
    const chartSeries = useVisibleSeries({preparedSeries, activeLegendItems});

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
        preparedLegend,
        preparedSeries: chartSeries,
        handleLegendItemClick,
    };
};

export const useShapeSeries = ({
    seriesData,
    seriesOptions,
    colors,
    preparedLegend,
    activeLegendItems,
}: {
    colors: string[];
    seriesData: ChartData['series']['data'];
    seriesOptions: ChartData['series']['options'];
    activeLegendItems: string[];
    preparedLegend?: PreparedLegend | null;
}) => {
    const [preparedSeries, setPreparedSeries] = React.useState<PreparedSeries[]>([]);

    React.useEffect(() => {
        (async () => {
            const items = await getPreparedSeries({
                seriesData,
                seriesOptions,
                preparedLegend,
                colors,
            });
            setPreparedSeries(items);
        })();
    }, [seriesData, seriesOptions, preparedLegend, colors]);

    const chartSeries = useVisibleSeries({preparedSeries, activeLegendItems});

    return {
        preparedSeries: chartSeries,
    };
};
