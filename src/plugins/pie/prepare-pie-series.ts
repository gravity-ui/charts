import {scaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {PreparedLegendOptions} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {ChartSeriesOptions, PieSeries, PieSeriesData} from '../../types';

import type {PreparedPieSeries} from './prepared-series';

type PreparePieSeriesArgs = {
    series: PieSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegendOptions;
    colors: string[];
};

function prepareSeriesData(series: PieSeries): PieSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => withSourcePoint(p, {...p, value: p.value ?? 0}));
        case 'skip':
        default:
            return data.filter((p) => p.value !== null);
    }
}

export function preparePieSeries(args: PreparePieSeriesArgs): PreparedPieSeries[] {
    const {series: seriesList, seriesOptions, legend, colors} = args;

    return seriesList.flatMap((series) => {
        const preparedData = prepareSeriesData(series);
        const dataNames = preparedData.map((d) => d.name);
        const colorScale = scaleOrdinal(dataNames, colors);
        const stackId = getUniqId();
        const seriesHoverState = get(seriesOptions, 'pie.states.hover');

        return preparedData.map<PreparedPieSeries>((dataItem) => {
            const id = getUniqId();
            const metadata = prepareSeriesMetadata({
                series: {
                    ...dataItem,
                    id,
                    cursor: series.cursor,
                    tooltip: series.tooltip,
                    custom: series.custom,
                },
                color: dataItem.color || colorScale(dataItem.name),
                legend: {enabled: series.legend?.enabled ?? legend.enabled},
                symbol: dataItem.legend?.symbol
                    ? prepareLegendSymbol(dataItem)
                    : prepareLegendSymbol(series),
            });
            const result: PreparedPieSeries = {
                ...metadata,
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
                center: series.center || ['50%', '50%'],
                borderColor: series.borderColor || '',
                borderRadius: series.borderRadius ?? 0,
                borderWidth: series.borderWidth ?? 1,
                radius: dataItem.radius ?? series.radius ?? '100%',
                innerRadius: series.innerRadius || 0,
                minRadius: series.minRadius,
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
            };

            return result;
        });
    });
}
