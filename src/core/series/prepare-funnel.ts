import {scaleOrdinal} from 'd3-scale';
import get from 'lodash/get';

import type {ChartSeriesOptions, FunnelSeries} from '../../types';
import {DEFAULT_DATALABELS_STYLE} from '../constants';
import {getUniqId} from '../utils';

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

    const shape = series.shape ?? 'rectangle';
    const isTrapezoid = shape === 'trapezoid';
    const userSpecifiedHeight = series.connectors?.height !== undefined;
    // For trapezoid: enable connectors only when the user has explicitly set a height or enabled them.
    // For rectangle: enable by default.
    const isConnectorsEnabled =
        series.connectors?.enabled ?? (isTrapezoid ? userSpecifiedHeight : true);

    const preparedSeries: PreparedSeries[] = series.data.map<PreparedFunnelSeries>((dataItem) => {
        const id = getUniqId();
        const color = dataItem.color || colorScale(dataItem.name);
        const result: PreparedFunnelSeries = {
            type: 'funnel',
            shape,
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
            id,
            color,
            legend: {
                enabled: dataItem.legend?.enabled ?? series.legend?.enabled ?? legend.enabled,
                symbol: dataItem.legend?.symbol
                    ? prepareLegendSymbol(dataItem)
                    : prepareLegendSymbol(series),
                groupId: dataItem.legend?.groupId ?? getUniqId(),
                itemText: dataItem.legend?.itemText ?? dataItem.name,
            },
            cursor: get(series, 'cursor', null),
            tooltip: series.tooltip,
            connectors: {
                enabled: isConnectorsEnabled,
                height: isConnectorsEnabled
                    ? (series.connectors?.height ?? (isTrapezoid ? 0 : '25%'))
                    : 0,
                lineDashStyle: series.connectors?.lineDashStyle ?? 'Dash',
                lineOpacity: series.connectors?.lineOpacity ?? (isTrapezoid ? 0 : 1),
                lineColor: series.connectors?.lineColor ?? 'var(--g-color-line-generic-active)',
                areaColor: series.connectors?.areaColor ?? color,
                areaOpacity: series.connectors?.areaOpacity ?? (isTrapezoid ? 0 : 0.25),
                lineWidth: series.connectors?.lineWidth ?? 1,
            },
        };

        return result;
    });

    return preparedSeries;
}
