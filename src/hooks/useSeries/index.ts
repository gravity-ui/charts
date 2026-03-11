import {group, scaleOrdinal} from 'd3';

import type {ChartData} from '../../types';
import {getSeriesNames} from '../../utils';

import {prepareSeries} from './prepareSeries';
import type {PreparedLegend, PreparedSeries} from './types';

export const getVisibleSeries = ({
    preparedSeries,
    activeLegendItems,
}: {
    preparedSeries: PreparedSeries[];
    activeLegendItems: string[];
}) => {
    return preparedSeries.map((singleSeries) => {
        if (singleSeries.legend.enabled) {
            return {
                ...singleSeries,
                visible: activeLegendItems.includes(singleSeries.legend.groupId),
            };
        }

        return singleSeries;
    });
};

export const getPreparedSeries = async ({
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
