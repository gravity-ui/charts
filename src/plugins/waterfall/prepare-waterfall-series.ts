import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedSeries, PreparedWaterfallSeries} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getUniqId} from '~core/utils';

import type {WaterfallSeries, WaterfallSeriesData} from '../../types';

function prepareSeriesData(series: WaterfallSeries): WaterfallSeriesData[] {
    const nullMode = series.nullMode ?? 'skip';
    const data = series.data;

    switch (nullMode) {
        case 'zero':
            return data.map((d) => ({
                ...d,
                y: d.total ? d.y : (d.y ?? 0),
            }));
        case 'skip':
        default:
            return data.filter((d) => d.y !== null);
    }
}

export function prepareWaterfallSeries(args: PrepareSeriesArgs<WaterfallSeries>): PreparedSeries[] {
    const {colorScale, series: seriesList, legend, colors, yAxis} = args;
    const [, negativeColor, positiveColor] = colors;
    const series = seriesList[0];

    const common: PreparedWaterfallSeries = {
        id: '',
        color: seriesList[0].color || colorScale(seriesList[0].name),
        type: series.type,
        name: series.name,
        visible: get(series, 'visible', true),
        dataLabels: {
            enabled: series.dataLabels?.enabled || true,
            style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
            allowOverlap: series.dataLabels?.allowOverlap || false,
            padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
            html: get(series, 'dataLabels.html', false),
            format: series.dataLabels?.format,
        },
        legend: {
            enabled: get(series, 'legend.enabled', legend.enabled),
            symbol: prepareLegendSymbol(series),
            groupId: '',
            itemText: '',
        },
        cursor: get(series, 'cursor', null),
        data: [],
        tooltip: {
            ...series.tooltip,
            valueFormat: series.tooltip?.valueFormat ?? getDefaultValueFormat({axis: yAxis?.[0]}),
        },
        custom: series.custom,
    };

    const positiveName = series.legend?.itemText?.positive ?? `${series.name} ↑`;
    const positive: PreparedWaterfallSeries = {
        ...common,
        name: positiveName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.positive ?? positiveName,
        },
        id: getUniqId(),
        color: series.positiveColor || positiveColor,
        data: [],
    };
    const negativeName = series.legend?.itemText?.negative ?? `${series.name} ↓`;
    const negative: PreparedWaterfallSeries = {
        ...common,
        name: negativeName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.negative ?? negativeName,
        },
        id: getUniqId(),
        color: series.negativeColor || negativeColor,
        data: [],
    };

    const totalsName = series.legend?.itemText?.totals ?? series.name;
    const totals: PreparedWaterfallSeries = {
        ...common,
        name: totalsName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.totals ?? totalsName,
        },
        id: getUniqId(),
        data: [],
    };

    const preparedData = prepareSeriesData(series);

    preparedData.forEach((d, index) => {
        const value = d?.y ?? 0;
        const dataItem = {...d, index};

        if (d?.total) {
            totals.data.push(dataItem);
        } else if (value >= 0) {
            positive.data.push(dataItem);
        } else if (value < 0) {
            negative.data.push(dataItem);
        }
    }, []);

    return [positive, negative, totals];
}
