import {scaleOrdinal} from 'd3-scale';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
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
    const ids = new Set<string>();
    for (const layer of layers) {
        const plugin = getSeriesPlugin(layer.series[0].type);
        const prepared = await plugin.prepareSeries({
            series: layer.series,
            seriesOptions,
            legend: preparedLegend,
            colorScale,
            colors,
            xAxis,
            yAxis,
        });
        for (const series of prepared) {
            if (ids.has(series.id)) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: `Duplicate prepared series ID: "${series.id}"`,
                });
            }
            ids.add(series.id);
            acc.push(series);
        }
    }

    return acc;
};
