import type {ScaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {prepareSeriesMetadata} from '~core/series/prepare-series-metadata';
import type {PreparedLegendOptions} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {ChartSeriesOptions, SankeySeries} from '../../types';

import type {PreparedSankeySeries} from './prepared-series';

type PrepareSankeySeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    legend: PreparedLegendOptions;
    series: SankeySeries[];
    seriesOptions?: ChartSeriesOptions;
};

export function prepareSankeySeries(args: PrepareSankeySeriesArgs) {
    const {colorScale, legend, series} = args;

    return series.map<PreparedSankeySeries>((s) => {
        const id = getUniqId();
        const name = s.name || '';
        const color = colorScale(name);

        const metadata = prepareSeriesMetadata({
            series: {...s, id, name},
            color,
            legend,
            symbol: prepareLegendSymbol(s),
        });
        const preparedSeries: PreparedSankeySeries = {
            ...metadata,
            data: s.data.map((d) =>
                withSourcePoint(d, {
                    custom: d.custom,
                    name: d.name,
                    color: d.color ?? colorScale(d.name),
                    links: d.links,
                }),
            ),
            dataLabels: {
                enabled: get(s, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, s.dataLabels?.style),
                format: s.dataLabels?.format,
            },
            type: s.type,
        };

        return preparedSeries;
    });
}
