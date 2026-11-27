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
import {resolveBarLabelPlacement} from '../bar-label-placement';

import {getWaterfallPointRole} from './utils';

export function prepareWaterfallPoints(series: WaterfallSeries): PreparedWaterfallSeriesData[] {
    const nullAsZero = series.nullMode === 'zero';
    const points: PreparedWaterfallSeriesData[] = [];

    series.data.forEach((point) => {
        const role = getWaterfallPointRole(point);
        if (point.y === null && !nullAsZero && role !== 'subtotal') return;

        const y = role === 'change' && nullAsZero ? (point.y ?? 0) : point.y;
        // A point without y can still reserve a position on the X axis.
        if (role === 'change' && y !== undefined && !Number.isFinite(y)) return;

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

    const totalColor = series.color || colorScale(series.name);
    const common = {
        type: series.type,
        visible: get(series, 'visible', true),
        connectors: {
            enabled: series.connectors?.enabled ?? true,
        },
        dataLabels: {
            enabled: series.dataLabels?.enabled ?? true,
            placement: resolveBarLabelPlacement(series.dataLabels?.placement),
            placementFallback: series.dataLabels?.placementFallback ?? 'show',
            style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
            allowOverlap: series.dataLabels?.allowOverlap || false,
            padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
            html: get(series, 'dataLabels.html', false),
            format: series.dataLabels?.format,
        } satisfies PreparedWaterfallSeries['dataLabels'],
        legend: {
            enabled: get(series, 'legend.enabled', legend.enabled),
            symbol: prepareLegendSymbol(series),
        },
        cursor: get(series, 'cursor', null),
        tooltip: {
            ...series.tooltip,
            valueFormat: series.tooltip?.valueFormat ?? getDefaultValueFormat({axis: yAxis?.[0]}),
        },
        custom: series.custom,
    };

    function createGroup(
        name: string,
        color: string,
        data: PreparedWaterfallSeriesData[],
    ): PreparedWaterfallSeries {
        return {
            ...common,
            id: getUniqId(),
            name,
            color,
            legend: {...common.legend, groupId: getUniqId(), itemText: name},
            data,
            fullData: data,
        };
    }

    const changesUp: PreparedWaterfallSeriesData[] = [];
    const changesDown: PreparedWaterfallSeriesData[] = [];
    const totals: PreparedWaterfallSeriesData[] = [];
    const subtotals: PreparedWaterfallSeriesData[] = [];
    for (const point of prepareWaterfallPoints(series)) {
        const role = getWaterfallPointRole(point);
        if (role === 'subtotal') {
            subtotals.push(point);
        } else if (role === 'total') {
            totals.push(point);
        } else if ((point.y ?? 0) < 0) {
            changesDown.push(point);
        } else {
            changesUp.push(point);
        }
    }

    const names = series.legend?.itemText;
    const groups = [
        createGroup(
            names?.positive ?? `${series.name} ↑`,
            series.positiveColor || positiveColor,
            changesUp,
        ),
        createGroup(
            names?.negative ?? `${series.name} ↓`,
            series.negativeColor || negativeColor,
            changesDown,
        ),
        createGroup(names?.totals ?? series.name, totalColor, totals),
    ];
    if (subtotals.length) {
        const options = series.subtotal;
        const group = createGroup(
            options?.name ?? 'Subtotal',
            options?.color ?? totalColor,
            subtotals,
        );
        group.legend.itemText = options?.legend?.itemText ?? group.name;
        group.legend.enabled = common.legend.enabled && (options?.legend?.enabled ?? true);
        group.tooltip = {
            enabled: options?.tooltip?.enabled ?? common.tooltip.enabled,
            valueFormat: options?.tooltip?.valueFormat ?? common.tooltip.valueFormat,
        };
        group.dataLabels = {
            ...common.dataLabels,
            enabled: options?.dataLabels?.enabled ?? common.dataLabels.enabled,
            format: options?.dataLabels?.format ?? common.dataLabels.format,
        };
        groups.push(group);
    }
    return groups;
}
