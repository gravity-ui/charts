import type {ScaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE, LayoutAlgorithm} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {PreparedLegendOptions} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getUniqId} from '~core/utils';

import type {ChartSeriesOptions, TreemapSeries} from '../../types';

import type {PreparedTreemapSeries} from './prepared-series';

type PrepareTreemapSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    legend: PreparedLegendOptions;
    series: TreemapSeries[];
    seriesOptions?: ChartSeriesOptions;
};

export function prepareTreemap(args: PrepareTreemapSeriesArgs) {
    const {colorScale, legend, series} = args;

    return series.map<PreparedTreemapSeries>((s) => {
        const id = getUniqId();
        const name = s.name || '';
        const color = s.color || colorScale(name);

        const metadata = prepareSeriesMetadata({
            series: {...s, id, name},
            color,
            legend,
            symbol: prepareLegendSymbol(s),
        });
        const preparedSeries: PreparedTreemapSeries = {
            ...metadata,
            data: s.data,
            dataLabels: {
                enabled: get(s, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, s.dataLabels?.style),
                padding: get(s, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(s, 'dataLabels.allowOverlap', false),
                html: get(s, 'dataLabels.html', false),
                align: get(s, 'dataLabels.align', 'left'),
                format: s.dataLabels?.format,
            },
            type: s.type,
            levels: s.levels ?? [],
            layoutAlgorithm: get(s, 'layoutAlgorithm', LayoutAlgorithm.Binary),
            sorting: {
                enabled: false,
                direction: 'desc',
                ...s.sorting,
            },
        };

        return preparedSeries;
    });
}
