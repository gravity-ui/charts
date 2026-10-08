import type {ChartSeries, ChartSeriesData, ChartTooltip, ChartXAxis, ChartYAxis} from '../../types';
import type {SeriesPlugin} from '../series/plugin';
import {getSeriesPlugin} from '../series/seriesRegistry';
import {getMinSpaceBetween} from '../utils/array';
import {isPointTooltipEnabled} from '../utils/tooltip-helpers';

import {getDefaultValueFormat, getTooltipAxisValue} from './utils';

interface TooltipSeries {
    type: ChartSeries['type'];
    yAxis?: number;
}

interface TooltipHeaderSeries extends TooltipSeries {
    data: ChartSeriesData | ChartSeriesData[];
    visible?: boolean;
    tooltip?: {enabled?: boolean};
}

interface TooltipHeaderItem {
    series: TooltipSeries;
}

interface PrepareTooltipHeaderFormatArgs {
    seriesData: TooltipHeaderSeries[];
    xAxis?: ChartXAxis | null;
    yAxes?: ChartYAxis[];
    dateTimeLabelFormats?: ChartTooltip['dateTimeLabelFormats'];
}

export function getTooltipYAxis(series: TooltipSeries, yAxes?: ChartYAxis[]) {
    return yAxes?.[series.yAxis ?? 0] ?? yAxes?.[0];
}

export function getTooltipHeader<T extends TooltipHeaderItem>(items: T[]) {
    let selected: {item: T; header: NonNullable<SeriesPlugin['tooltip']['header']>} | undefined;
    for (const item of items) {
        const header = getSeriesPlugin(item.series.type).tooltip.header;
        if (header && (!selected || (header.priority ?? 0) > (selected.header.priority ?? 0))) {
            selected = {item, header};
        }
    }
    return selected;
}

/** Cache full-series date intervals outside hover updates; select the format using hovered headers. */
export function prepareTooltipHeaderFormat({
    seriesData,
    xAxis,
    yAxes,
    dateTimeLabelFormats,
}: PrepareTooltipHeaderFormatArgs) {
    const eligibleItems: TooltipHeaderItem[] = [];
    const groups = new Map<
        string | number,
        {axis?: ChartXAxis | ChartYAxis | null; values: Set<number>}
    >();
    const getAxisKey = (series: TooltipSeries, direction: 'x' | 'y') => {
        if (direction === 'x') return 'x';
        const index = series.yAxis ?? 0;
        return yAxes?.[index] ? index : 0;
    };
    const getAxis = (series: TooltipSeries, direction: 'x' | 'y') =>
        direction === 'x' ? xAxis : getTooltipYAxis(series, yAxes);

    for (const series of seriesData) {
        if (series.visible === false) continue;
        const header = getSeriesPlugin(series.type).tooltip.header;
        if (!header) continue;
        const data = Array.isArray(series.data) ? series.data : [series.data];
        const points = data.filter((point) => isPointTooltipEnabled({data: point, series}));
        // Empty series still provide a default format to getDefaultTooltipHeaderFormat callers.
        const enabled = data.length ? points.length > 0 : isPointTooltipEnabled({series});
        if (!enabled) continue;
        eligibleItems.push({series});
        if (!header.axis || header.requiresFormat) continue;

        const axis = getAxis(series, header.axis);
        const key = getAxisKey(series, header.axis);
        const group = groups.get(key) ?? {axis, values: new Set<number>()};
        groups.set(key, group);
        if (axis?.type !== 'datetime') continue;
        for (const point of points) {
            const value = getTooltipAxisValue(point, header.axis, axis);
            if (typeof value === 'number' && Number.isFinite(value)) {
                group.values.add(value);
            }
        }
    }

    const formats = new Map<string | number, ChartTooltip['headerFormat']>();
    for (const [key, {axis, values}] of groups) {
        formats.set(
            key,
            getDefaultValueFormat({
                axis,
                closestPointsRange: getMinSpaceBetween(
                    [...values].sort((a, b) => a - b),
                    (value) => value,
                ),
                dateTimeLabelFormats,
            }),
        );
    }

    return (items: TooltipHeaderItem[] = eligibleItems) => {
        const selected = getTooltipHeader(items);
        if (!selected?.header.axis || selected.header.requiresFormat) return undefined;
        return formats.get(getAxisKey(selected.item.series, selected.header.axis));
    };
}
