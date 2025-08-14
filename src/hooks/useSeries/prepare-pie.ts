import {scaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE, DEFAULT_PALETTE} from '../../constants';
import type {ChartSeriesOptions, PieSeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING} from './constants';
import type {PreparedLegend, PreparedPieSeries, PreparedSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PreparePieSeriesArgs = {
    series: PieSeries;
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
};

export function preparePieSeries(args: PreparePieSeriesArgs) {
    const {series, seriesOptions, legend} = args;
    const dataNames = series.data.map((d) => d.name);
    const colorScale = scaleOrdinal(dataNames, DEFAULT_PALETTE);
    const stackId = getUniqId();
    const seriesHoverState = get(seriesOptions, 'pie.states.hover');

    const preparedSeries: PreparedSeries[] = series.data.map<PreparedPieSeries>((dataItem, i) => {
        const result: PreparedPieSeries = {
            type: 'pie',
            data: dataItem,
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                connectorPadding: get(series, 'dataLabels.connectorPadding', 5),
                connectorShape: get(series, 'dataLabels.connectorShape', 'polyline'),
                distance: get(series, 'dataLabels.distance', 25),
                connectorCurve: get(series, 'dataLabels.connectorCurve', 'basic'),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            label: dataItem.label,
            value: dataItem.value,
            visible: typeof dataItem.visible === 'boolean' ? dataItem.visible : true,
            name: dataItem.name,
            id: `Series ${i}`,
            color: dataItem.color || colorScale(dataItem.name),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
            },
            center: series.center || ['50%', '50%'],
            borderColor: series.borderColor || '',
            borderRadius: series.borderRadius ?? 0,
            borderWidth: series.borderWidth ?? 1,
            radius: dataItem.radius ?? series.radius ?? '100%',
            innerRadius: series.innerRadius || 0,
            stackId,
            states: {
                hover: {
                    halo: {
                        enabled: get(seriesHoverState, 'halo.enabled', true),
                        opacity: get(seriesHoverState, 'halo.opacity', 0.25),
                        size: get(seriesHoverState, 'halo.size', 10),
                    },
                },
            },
            renderCustomShape: series.renderCustomShape,
            opacity: get(dataItem, 'opacity', null),
            cursor: get(series, 'cursor', null),
        };

        return result;
    });

    return preparedSeries;
}
