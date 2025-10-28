import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE} from '../../constants';
import type {ChartSeriesOptions, HeatmapSeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING} from './constants';
import type {PreparedHeatmapSeries, PreparedLegend, PreparedSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareHeatmapSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: HeatmapSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
};

export function prepareHeatmapSeries(args: PrepareHeatmapSeriesArgs): PreparedSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

    return seriesList.map<PreparedHeatmapSeries>((series) => {
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
            data: series.data,
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                html: series.dataLabels?.html ?? false,
                format: series.dataLabels?.format,
            },
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
            tooltip: series.tooltip,
            borderColor: series.borderColor ?? seriesOptions?.heatmap?.borderColor ?? 0,
            borderWidth: series.borderWidth ?? seriesOptions?.heatmap?.borderWidth ?? 0,
        };
    }, []);
}
