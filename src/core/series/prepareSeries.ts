import {group} from 'd3-array';
import {scaleOrdinal} from 'd3-scale';

import type {ChartData, ChartXAxis, ChartYAxis} from '../../types';
import {getSeriesNames} from '../utils';

import type {RefreshSourceReferencesArgs} from './plugin';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedLegendOptions, PreparedSeries} from './types';

const preparedSeriesSourceKeys = new WeakMap<PreparedSeries[], object>();

export function getPreparedSeriesSourceKey(series?: PreparedSeries[]): object | undefined {
    if (!series) {
        return undefined;
    }

    let key = preparedSeriesSourceKeys.get(series);
    if (!key) {
        key = {};
        preparedSeriesSourceKeys.set(series, key);
    }

    return key;
}

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

export function refreshPreparedSeriesSourceReferences({
    series,
    preparedSeries,
}: RefreshSourceReferencesArgs): PreparedSeries[] {
    const sourceGroups = group(series, (item) => item.type);
    const preparedGroups = group(preparedSeries, (item) => item.type);
    const replacements = new Map<PreparedSeries, PreparedSeries>();

    for (const [type, preparedGroup] of preparedGroups) {
        const plugin = getSeriesPlugin(type);
        if (!plugin.refreshSourceReferences) {
            continue;
        }

        const refreshedGroup = plugin.refreshSourceReferences({
            series: sourceGroups.get(type) ?? [],
            preparedSeries: preparedGroup,
        });
        preparedGroup.forEach((prepared, index) => {
            const refreshed = refreshedGroup[index];
            if (refreshed && refreshed !== prepared) {
                replacements.set(prepared, refreshed);
            }
        });
    }

    if (!replacements.size) {
        return preparedSeries;
    }

    const refreshedSeries = preparedSeries.map(
        (prepared) => replacements.get(prepared) ?? prepared,
    );
    const sourceKey = getPreparedSeriesSourceKey(preparedSeries);
    if (sourceKey) {
        preparedSeriesSourceKeys.set(refreshedSeries, sourceKey);
    }
    return refreshedSeries;
}
