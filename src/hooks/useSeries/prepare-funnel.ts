import {scaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE} from '../../constants';
import type {ChartSeriesOptions, FunnelSeries} from '../../types';

import type {PreparedFunnelSeries, PreparedLegend, PreparedSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareFunnelSeriesArgs = {
    series: FunnelSeries;
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colors: string[];
};

export function prepareFunnelSeries(args: PrepareFunnelSeriesArgs) {
    const {series, legend, colors} = args;
    const dataNames = series.data.map((d) => d.name);
    const colorScale = scaleOrdinal(dataNames, colors);

    const isConnectorsEnabled = series.connectors?.enabled ?? true;

    const preparedSeries: PreparedSeries[] = series.data.map<PreparedFunnelSeries>(
        (dataItem, i) => {
            const color = dataItem.color || colorScale(dataItem.name);
            const result: PreparedFunnelSeries = {
                type: 'funnel',
                data: dataItem,
                dataLabels: {
                    enabled: get(series, 'dataLabels.enabled', true),
                    style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                    html: get(series, 'dataLabels.html', false),
                    format: series.dataLabels?.format,
                    align: series.dataLabels?.align ?? 'center',
                },
                visible: true,
                name: dataItem.name,
                id: `Series ${i}`,
                color,
                legend: {
                    enabled: get(series, 'legend.enabled', legend.enabled),
                    symbol: prepareLegendSymbol(series),
                },
                cursor: get(series, 'cursor', null),
                tooltip: series.tooltip,
                connectors: {
                    enabled: isConnectorsEnabled,
                    height: isConnectorsEnabled ? (series.connectors?.height ?? '25%') : 0,
                    lineDashStyle: series.connectors?.lineDashStyle ?? 'Dash',
                    lineOpacity: series.connectors?.lineOpacity ?? 1,
                    lineColor: series.connectors?.lineColor ?? 'var(--g-color-line-generic-active)',
                    areaColor: series.connectors?.areaColor ?? color,
                    areaOpacity: series.connectors?.areaOpacity ?? 0.25,
                    lineWidth: series.connectors?.lineWidth ?? 1,
                },
            };

            return result;
        },
    );

    return preparedSeries;
}
