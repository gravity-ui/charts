import {group} from 'd3-array';
import {scaleOrdinal} from 'd3-scale';

import type {ChartData} from '../../types';
import {getSeriesNames} from '../utils';

import type {PrepareSeriesArgs} from './plugin';
import {getSeriesPlugin} from './seriesRegistry';
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
        acc.push(
            ...(await prepareSeries({
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

export async function prepareSeries(args: PrepareSeriesArgs): Promise<PreparedSeries[]> {
    const plugin = getSeriesPlugin(args.series[0].type);
    return plugin.prepareSeries(args);
}
