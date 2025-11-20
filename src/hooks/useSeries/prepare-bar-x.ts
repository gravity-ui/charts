import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '../../constants';
import type {BarXSeries, BarXSeriesData, ChartSeriesOptions} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING} from './constants';
import type {PreparedBarXSeries, PreparedLegend, PreparedSeries} from './types';
import {getSeriesStackId, prepareLegendSymbol} from './utils';

type PrepareBarXSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: BarXSeries[];
    legend: PreparedLegend;
    seriesOptions?: ChartSeriesOptions;
};

function prepareSeriesData(series: BarXSeries): BarXSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => ({...p, y: p.y ?? 0}));
        case 'skip':
        default:
            return data.filter((p) => p.y !== null);
    }
}

export function prepareBarXSeries(args: PrepareBarXSeriesArgs): PreparedSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend} = args;

    return seriesList.map<PreparedBarXSeries>((series) => {
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const dataLabelsInside =
            series.stacking === 'percent' ? true : get(series, 'dataLabels.inside', false);

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
            data: prepareSeriesData(series),
            stacking: series.stacking,
            stackId: getSeriesStackId(series),
            dataLabels: {
                enabled: series.dataLabels?.enabled || false,
                inside: dataLabelsInside,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                allowOverlap: series.dataLabels?.allowOverlap || false,
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
            borderRadius: get(series, 'borderRadius', get(seriesOptions, 'bar-x.borderRadius', 0)),
            tooltip: series.tooltip,
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
        };
    }, []);
}
