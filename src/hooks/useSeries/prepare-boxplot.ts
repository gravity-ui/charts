import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import type {BoxplotSeries, ChartSeriesOptions} from '../../types';
import {getUniqId} from '../../utils';

import type {PreparedBoxplotSeries, PreparedLegend} from './types';
import {prepareLegendSymbol} from './utils';

interface PrepareBoxplotSeriesArgs {
    colorScale: ScaleOrdinal<string, string>;
    series: BoxplotSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
}

export function prepareBoxplotSeries(args: PrepareBoxplotSeriesArgs): PreparedBoxplotSeries[] {
    const {colorScale, series, seriesOptions, legend} = args;

    return series.map<PreparedBoxplotSeries>((s) => {
        const id = getUniqId();
        const name = 'name' in s && s.name ? s.name : '';

        const prepared: PreparedBoxplotSeries = {
            id,
            type: s.type,
            name,
            color: get(s, 'color', colorScale(name)),
            visible: get(s, 'visible', true),
            legend: {
                enabled: get(s, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(s),
            },
            data: s.data,
            cursor: get(s, 'cursor', null),
            yAxis: get(s, 'yAxis', 0),
            boxWidth: get(s, 'boxWidth', get(seriesOptions, 'boxplot.boxWidth', 0.5)),
            whiskerWidth: get(s, 'whiskerWidth', get(seriesOptions, 'boxplot.whiskerWidth', 0.5)),
            showOutliers: get(s, 'showOutliers', get(seriesOptions, 'boxplot.showOutliers', true)),
            outlierRadius: get(s, 'outlierRadius', get(seriesOptions, 'boxplot.outlierRadius', 3)),
        };

        return prepared;
    });
}
