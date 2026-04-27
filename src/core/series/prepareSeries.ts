import {group} from 'd3-array';
import type {ScaleOrdinal} from 'd3-scale';
import {scaleOrdinal} from 'd3-scale';

import {ChartError} from '../../libs';
import type {ChartData, ChartSeries, ChartSeriesOptions} from '../../types';
import {pluginRegistry} from '../plugins';
import {getSeriesNames} from '../utils';

import type {PreparedLegend, PreparedSeries} from './types';

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
        const seriesType = seriesList[0].type;
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

export async function prepareSeries(args: {
    type: ChartSeries['type'];
    series: ChartSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colors: string[];
    colorScale: ScaleOrdinal<string, string>;
}): Promise<PreparedSeries[]> {
    const {type, series, seriesOptions, legend, colors, colorScale} = args;

    const plugin = pluginRegistry.get(type);

    if (!plugin) {
        throw new ChartError({
            message: `Series type "${type}" does not support data preparation for series that do not support the presence of axes`,
        });
    }

    return plugin.prepareSeries({series, seriesOptions, legend, colors, colorScale});
}
