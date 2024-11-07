import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import type {BarXSeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING, DEFAULT_DATALABELS_STYLE} from './constants';
import type {PreparedBarXSeries, PreparedLegend, PreparedSeries} from './types';
import {getSeriesStackId, prepareLegendSymbol} from './utils';

type PrepareBarXSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: BarXSeries[];
    legend: PreparedLegend;
};

export function prepareBarXSeries(args: PrepareBarXSeriesArgs): PreparedSeries[] {
    const {colorScale, series: seriesList, legend} = args;

    return seriesList.map<PreparedBarXSeries>((series) => {
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
            },
            data: series.data,
            stacking: series.stacking,
            stackId: getSeriesStackId(series),
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                inside:
                    typeof series.dataLabels?.inside === 'boolean'
                        ? series.dataLabels?.inside
                        : false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                allowOverlap: series.dataLabels?.allowOverlap || false,
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                html: get(series, 'dataLabels.html', false),
            },
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
        };
    }, []);
}
