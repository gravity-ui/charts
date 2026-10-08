import {scaleOrdinal} from 'd3-scale';

import type {ChartData, ChartXAxis, ChartYAxis} from '../../types';
import {getSeriesNames} from '../utils';

import {getSeriesLayers} from './layers';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedLegendOptions, PreparedSeries} from './types';

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
    preparedLegend?: PreparedLegendOptions | null;
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}) => {
    const seriesNames = getSeriesNames(seriesData);
    const colorScale = scaleOrdinal(seriesNames, colors);
    const acc: PreparedSeries[] = [];

    if (!preparedLegend) {
        return acc;
    }

    const layers = getSeriesLayers(seriesData, (item, index) => `${item.type}_${index}`);
    for (const layer of layers) {
        const seriesList = [...layer.series];
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
