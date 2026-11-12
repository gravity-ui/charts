import get from 'es-toolkit/compat/get';

import {DASH_STYLE, DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import type {ChartSeriesOptions} from '~core/types';
import {getUniqId} from '~core/utils';

import type {XRangeSeries} from '../../types';

import type {PreparedXRangeSeries} from './prepared-series';

export function prepareXRangeSeries(
    args: PrepareSeriesArgs<XRangeSeries, ChartSeriesOptions>,
): PreparedXRangeSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis} = args;

    return seriesList.map<PreparedXRangeSeries>((series) => {
        const name = series.name || '';
        const color = series.color || colorScale(name);

        const metadata = prepareSeriesMetadata({
            series: {...series, id: getUniqId(), name},
            color,
            legend,
            symbol: prepareLegendSymbol(series),
        });
        return {
            ...metadata,
            type: series.type,
            data: series.data,
            opacity: series.opacity ?? null,
            borderRadius: series.borderRadius ?? seriesOptions?.['x-range']?.borderRadius ?? 0,
            borderWidth: series.borderWidth ?? seriesOptions?.['x-range']?.borderWidth ?? 0,
            borderColor:
                series.borderColor ??
                seriesOptions?.['x-range']?.borderColor ??
                'var(--gcharts-shape-border-color)',
            borderDashStyle:
                series.borderDashStyle ??
                seriesOptions?.['x-range']?.borderDashStyle ??
                DASH_STYLE.Solid,
            tooltip: {
                ...series.tooltip,
                valueFormat: series.tooltip?.valueFormat ?? getDefaultValueFormat({axis: xAxis}),
            },
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', false),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                html: get(series, 'dataLabels.html', false),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                format: series.dataLabels?.format,
            },
        };
    });
}
