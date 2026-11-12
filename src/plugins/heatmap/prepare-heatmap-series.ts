import type {ScaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {PreparedLegendOptions} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {ChartSeriesOptions, HeatmapSeries, HeatmapSeriesData} from '../../types';

import type {PreparedHeatmapSeries} from './prepared-series';

type PrepareHeatmapSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: HeatmapSeries[];
    legend: PreparedLegendOptions;
    seriesOptions?: ChartSeriesOptions;
};

function prepareSeriesData(series: HeatmapSeries): HeatmapSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => withSourcePoint(p, {...p, value: p.value ?? 0}));
        case 'skip':
        default:
            return data;
    }
}

export function prepareHeatmapSeries(args: PrepareHeatmapSeriesArgs): PreparedHeatmapSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

    return seriesList.map<PreparedHeatmapSeries>((series) => {
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
            data: prepareSeriesData(series),
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                html: series.dataLabels?.html ?? false,
                format: series.dataLabels?.format,
            },
            yAxis: get(series, 'yAxis', 0),
            borderColor:
                series.borderColor ??
                seriesOptions?.heatmap?.borderColor ??
                'var(--gcharts-shape-border-color)',
            borderWidth: series.borderWidth ?? seriesOptions?.heatmap?.borderWidth ?? 0,
        };
    }, []);
}
