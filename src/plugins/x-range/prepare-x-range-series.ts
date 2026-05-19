import get from 'lodash/get';

import {DASH_STYLE, DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedXRangeSeries} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getUniqId} from '~core/utils';

import type {XRangeSeries} from '../../types';

export function prepareXRangeSeries(args: PrepareSeriesArgs<XRangeSeries>): PreparedXRangeSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis} = args;

    return seriesList.map<PreparedXRangeSeries>((series) => {
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
                groupId: series.legend?.groupId ?? getUniqId(),
                itemText: series.legend?.itemText ?? name,
            },
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
            cursor: get(series, 'cursor', null),
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
