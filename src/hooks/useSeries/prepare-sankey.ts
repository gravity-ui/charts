import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import type {ChartSeriesOptions, SankeySeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_STYLE} from './constants';
import type {PreparedLegend, PreparedSankeySeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareSankeySeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    legend: PreparedLegend;
    series: SankeySeries[];
    seriesOptions?: ChartSeriesOptions;
};

export function prepareSankeySeries(args: PrepareSankeySeriesArgs) {
    const {colorScale, legend, series} = args;

    return series.map<PreparedSankeySeries>((s) => {
        const id = getUniqId();
        const name = s.name || '';
        const color = colorScale(name);

        const preparedSeries: PreparedSankeySeries = {
            color,
            data: s.data.map((d) => ({
                name: d.name,
                color: d.color ?? colorScale(d.name),
                links: d.links,
            })),
            dataLabels: {
                enabled: get(s, 'dataLabels.enabled', true),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, s.dataLabels?.style),
                format: s.dataLabels?.format,
            },
            id,
            type: s.type,
            name,
            visible: get(s, 'visible', true),
            legend: {
                enabled: get(s, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(s),
            },
            cursor: get(s, 'cursor', null),
        };

        return preparedSeries;
    });
}
