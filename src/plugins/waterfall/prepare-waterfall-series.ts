import get from 'es-toolkit/compat/get';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedWaterfallSeries, PreparedWaterfallSeriesData} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getUniqId} from '~core/utils';
import {withSourcePoint} from '~core/utils/source-point';

import type {WaterfallSeries} from '../../types';

export function prepareWaterfallPoints(series: WaterfallSeries): PreparedWaterfallSeriesData[] {
    const nullAsZero = series.nullMode === 'zero';
    const points: PreparedWaterfallSeriesData[] = [];

    series.data.forEach((point) => {
        if (point.y === null && !nullAsZero) return;

        const y = !point.total && nullAsZero ? (point.y ?? 0) : point.y;
        if (!point.total && (typeof y !== 'number' || !Number.isFinite(y))) return;

        points.push(
            withSourcePoint(point, {
                ...point,
                ...(y === point.y ? {} : {y}),
                index: points.length,
            }),
        );
    });

    return points;
}

export function prepareWaterfallSeries(
    args: PrepareSeriesArgs<WaterfallSeries>,
): PreparedWaterfallSeries[] {
    const {colorScale, series: seriesList, legend, colors, yAxis} = args;
    const [, negativeColor, positiveColor] = colors;
    const series = seriesList[0];

    const common: Omit<PreparedWaterfallSeries, 'fullData'> = {
        id: '',
        color: seriesList[0].color || colorScale(seriesList[0].name),
        type: series.type,
        name: series.name,
        visible: get(series, 'visible', true),
        connectors: {
            enabled: series.connectors?.enabled ?? true,
        },
        dataLabels: {
            enabled: series.dataLabels?.enabled ?? true,
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
    const positive = {
        ...common,
        name: positiveName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.positive ?? positiveName,
        },
        id: getUniqId(),
        color: series.positiveColor || positiveColor,
        data: [] as PreparedWaterfallSeriesData[],
    };
    const negativeName = series.legend?.itemText?.negative ?? `${series.name} ↓`;
    const negative = {
        ...common,
        name: negativeName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.negative ?? negativeName,
        },
        id: getUniqId(),
        color: series.negativeColor || negativeColor,
        data: [] as PreparedWaterfallSeriesData[],
    };

    const totalsName = series.legend?.itemText?.totals ?? series.name;
    const totals = {
        ...common,
        name: totalsName,
        legend: {
            ...common.legend,
            groupId: getUniqId(),
            itemText: series.legend?.itemText?.totals ?? totalsName,
        },
        id: getUniqId(),
        data: [] as PreparedWaterfallSeriesData[],
    };

    for (const point of prepareWaterfallPoints(series)) {
        if (point.total) {
            totals.data.push(point);
        } else if ((point.y ?? 0) < 0) {
            negative.data.push(point);
        } else {
            positive.data.push(point);
        }
    }

    return [positive, negative, totals].map((item) => ({...item, fullData: item.data}));
}
