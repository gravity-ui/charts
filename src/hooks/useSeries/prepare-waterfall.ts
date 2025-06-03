import type {ScaleOrdinal} from 'd3';
import get from 'lodash/get';

import {DEFAULT_PALETTE} from '../../constants';
import type {WaterfallSeries} from '../../types';
import {getUniqId} from '../../utils';

import {DEFAULT_DATALABELS_PADDING, DEFAULT_DATALABELS_STYLE} from './constants';
import type {PreparedLegend, PreparedSeries, PreparedWaterfallSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareWaterfallSeriesArgs = {
    colorScale: ScaleOrdinal<string, string>;
    series: WaterfallSeries[];
    legend: PreparedLegend;
};

export function prepareWaterfallSeries(args: PrepareWaterfallSeriesArgs): PreparedSeries[] {
    const {colorScale, series: seriesList, legend} = args;
    const [, negativeColor, positiveColor] = DEFAULT_PALETTE;
    const series = seriesList[0];

    const common: PreparedWaterfallSeries = {
        id: '',
        color: seriesList[0].color || colorScale(seriesList[0].name),
        type: series.type,
        name: series.name,
        visible: get(series, 'visible', true),
        legend: {
            enabled: get(series, 'legend.enabled', legend.enabled),
            symbol: prepareLegendSymbol(series),
        },
        dataLabels: {
            enabled: series.dataLabels?.enabled || true,
            style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
            allowOverlap: series.dataLabels?.allowOverlap || false,
            padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
            html: get(series, 'dataLabels.html', false),
            format: series.dataLabels?.format,
        },
        cursor: get(series, 'cursor', null),
        data: [],
    };

    const positive: PreparedWaterfallSeries = {
        ...common,
        name: series.legend?.itemText?.positive ?? `${series.name} ↑`,
        id: getUniqId(),
        color: series.positiveColor || positiveColor,
        data: [],
    };
    const negative: PreparedWaterfallSeries = {
        ...common,
        name: series.legend?.itemText?.negative ?? `${series.name} ↓`,
        id: getUniqId(),
        color: series.negativeColor || negativeColor,
        data: [],
    };
    const totals: PreparedWaterfallSeries = {
        ...common,
        name: series.legend?.itemText?.totals ?? series.name,
        id: getUniqId(),
        data: [],
    };

    series.data.forEach((d, index) => {
        const value = d?.y ?? 0;
        const dataItem = {...d, index};

        if (d?.total) {
            totals.data.push(dataItem);
        } else if (value > 0) {
            positive.data.push(dataItem);
        } else if (value < 0) {
            negative.data.push(dataItem);
        }
    }, []);

    return [positive, negative, totals];
}
