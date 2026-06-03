import {group} from 'd3-array';
import {scaleOrdinal} from 'd3-scale';

import type {ChartData, ChartXAxis, ChartYAxis} from '../../types';
import {getSeriesNames} from '../utils';

import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedLegend, PreparedSeries} from './types';

export const getPreparedSeries = async ({
    seriesData,
    seriesOptions,
    colors,
    preparedLegend,
    xAxis,
    yAxis,
}: {
    seriesData: ChartData['series']['data'];
    seriesOptions: ChartData['series']['options'];
    colors: string[];
    preparedLegend?: PreparedLegend | null;
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}) => {
    const seriesNames = getSeriesNames(seriesData);
    const colorScale = scaleOrdinal(seriesNames, colors);
    const groupedSeries = group(seriesData, (item, index) => {
        if (item.type === 'line') {
            return `${item.type}_${index}`;
        }

        return item.type;
    });

    const acc: PreparedSeries[] = [];

    if (!preparedLegend) {
        return acc;
    }

    const list = Array.from(groupedSeries);
    for (let i = 0; i < list.length; i++) {
        const [_groupId, seriesList] = list[i];
        const plugin = getSeriesPlugin(seriesList[0].type);
        acc.push(
            ...(await plugin.prepareSeries({
                series: seriesList,
                seriesOptions,
                legend: preparedLegend,
                colorScale,
                colors,
                xAxis,
                yAxis,
            })),
        );
    }

    return acc;
};
