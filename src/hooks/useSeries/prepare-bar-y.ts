import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE} from '../../constants';
import type {BarYSeries, ChartSeriesOptions} from '../../types';
import {getLabelsSize, getUniqId} from '../../utils';
import {getFormattedValue} from '../../utils/chart/format';

import type {PreparedBarYSeries, PreparedLegend} from './types';
import {getSeriesStackId, prepareLegendSymbol} from './utils';

type PrepareBarYSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: BarYSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
};

async function prepareDataLabels(series: BarYSeries) {
    const enabled = get(series, 'dataLabels.enabled', false);
    const style = Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style);
    const html = get(series, 'dataLabels.html', false);
    const labels = enabled
        ? series.data.map((d) => getFormattedValue({value: d.x || d.label, ...series.dataLabels}))
        : [];
    const {maxHeight = 0, maxWidth = 0} = await getLabelsSize({
        labels,
        style,
        html,
    });
    const inside = series.stacking === 'percent' ? true : get(series, 'dataLabels.inside', false);

    return {
        enabled,
        inside,
        style,
        maxHeight,
        maxWidth,
        html,
        format: series.dataLabels?.format,
        allowOverlap: series.dataLabels?.allowOverlap ?? false,
    };
}

export function prepareBarYSeries(args: PrepareBarYSeriesArgs) {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

    return Promise.all(
        seriesList.map<Promise<PreparedBarYSeries>>(async (series) => {
            const name = series.name || '';
            const color = series.color || colorScale(name);

            return {
                type: series.type,
                color,
                name,
                id: getUniqId(),
                visible: get(series, 'visible', true),
                legend: {
                    enabled: get(series, 'legend.enabled', legend.enabled),
                    symbol: prepareLegendSymbol(series),
                },
                data: series.data.filter((d) => d.x !== null),
                stacking: series.stacking,
                stackId: getSeriesStackId(series),
                dataLabels: await prepareDataLabels(series),
                cursor: get(series, 'cursor', null),
                borderRadius: series.borderRadius ?? seriesOptions?.['bar-y']?.borderRadius ?? 0,
                borderWidth: series.borderWidth ?? seriesOptions?.['bar-y']?.borderWidth ?? 0,
                borderColor:
                    series.borderColor ??
                    seriesOptions?.['bar-y']?.borderColor ??
                    'var(--gcharts-shape-border-color)',
                tooltip: series.tooltip,
            };
        }),
    );
}
