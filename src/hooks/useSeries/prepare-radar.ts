import {scaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_PALETTE} from '../../constants';
import type {ChartSeriesOptions, RadarSeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING, DEFAULT_DATALABELS_STYLE} from './constants';
import type {PreparedLegend, PreparedRadarSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareRadarSeriesArgs = {
    series: RadarSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
};

export function prepareRadarSeries(args: PrepareRadarSeriesArgs) {
    const {series: radarSeries, seriesOptions: _seriesOptions, legend} = args;
    const colorScale = scaleOrdinal(
        radarSeries.map((s, index) => s.name ?? `Series ${index + 1}`),
        DEFAULT_PALETTE,
    );
    const categories = radarSeries.find((s) => s.categories)?.categories ?? [];

    return radarSeries.map((series, index) => {
        const name = series.name ?? `Series ${index + 1}`;
        const color = series.color ?? colorScale(name);
        const preparedSeries: PreparedRadarSeries = {
            type: 'radar',
            data: series.data,
            categories,
            id: getUniqId(),
            name,
            color,
            visible: typeof series.visible === 'boolean' ? series.visible : true,
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
            },
            borderColor: series.borderColor || color,
            borderWidth: series.borderWidth ?? 1,
            fillOpacity: series.fillOpacity ?? 0.25,
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
            },
            cursor: get(series, 'cursor', null),
        };

        return preparedSeries;
    });
}
