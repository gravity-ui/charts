import {scaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_PALETTE} from '../../constants';
import type {ChartSeriesOptions, RadarSeries} from '../../types';

import {DEFAULT_DATALABELS_PADDING, DEFAULT_DATALABELS_STYLE} from './constants';
import type {PreparedLegend, PreparedRadarSeries, PreparedSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareRadarSeriesArgs = {
    series: RadarSeries;
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
};

export function prepareRadarSeries(args: PrepareRadarSeriesArgs) {
    const {series, seriesOptions: _seriesOptions, legend} = args;
    const dataNames = series.data.map((d) => d.name || '');
    const colorScale = scaleOrdinal(dataNames, DEFAULT_PALETTE);

    const preparedSeries: PreparedSeries[] = [
        {
            type: 'radar',
            data: series.data,
            categories: series.categories || [],
            id: `Radar Series`,
            name: series.name || 'Radar',
            color: series.color || colorScale(series.name || 'Radar'),
            visible: typeof series.visible === 'boolean' ? series.visible : true,
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
            },
            borderColor: series.borderColor || '',
            borderWidth: series.borderWidth ?? 1,
            fillOpacity: series.fillOpacity ?? 0.5,
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
            },
            renderCustomShape: series.renderCustomShape,
            cursor: get(series, 'cursor', null),
        } as PreparedRadarSeries,
    ];

    return preparedSeries;
}
