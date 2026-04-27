import type {ScaleOrdinal} from 'd3-scale';
import get from 'lodash/get';

import type {ChartSeriesOptions, XRangeSeries} from '../../../../types';
import {DASH_STYLE, DEFAULT_DATALABELS_STYLE} from '../../../constants';
import {DEFAULT_DATALABELS_PADDING} from '../../../series/constants';
import type {PreparedLegend, PreparedXRangeSeries} from '../../../series/types';
import {prepareLegendSymbol} from '../../../series/utils';
import {getUniqId} from '../../../utils';

type PrepareXRangeSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: XRangeSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
};

export function prepareXRangeSeries(args: PrepareXRangeSeriesArgs): PreparedXRangeSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

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
            tooltip: series.tooltip,
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
