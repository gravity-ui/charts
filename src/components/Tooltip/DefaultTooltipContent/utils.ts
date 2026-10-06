import get from 'lodash/get';

import {i18n} from '~core/i18n';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import {getTooltipAxisValue} from '~core/tooltip/utils';
import {getFormattedValue} from '~core/utils/format';

import type {PreparedPieSeries} from '../../../hooks';
import type {
    ChartSeriesData,
    ChartTooltip,
    ChartTooltipTotalsAggregationValue,
    ChartTooltipTotalsBuiltInAggregation,
    ChartXAxis,
    ChartYAxis,
    RadarSeriesData,
    TooltipDataChunk,
    TooltipDataChunkRadar,
    TooltipDataChunkSankey,
    TreemapSeriesData,
} from '../../../types';

export type HoveredValue = string | number | null | undefined;

function getSeriesYAxis(item: TooltipDataChunk, yAxes?: ChartYAxis[]) {
    return yAxes?.[get(item.series, 'yAxis') ?? 0] ?? yAxes?.[0];
}

export function getXRowData(data: ChartSeriesData, xAxis?: ChartXAxis | null) {
    return getTooltipAxisValue(data, 'x', xAxis);
}

function getYRowData(data: ChartSeriesData, yAxis?: ChartYAxis) {
    return getTooltipAxisValue(data, 'y', yAxis);
}

export const getMeasureValue = ({
    data,
    xAxis,
    yAxes,
    headerFormat,
}: {
    data: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxes?: ChartYAxis[];
    headerFormat?: ChartTooltip['headerFormat'];
}) => {
    if (
        data.every((item) =>
            ['pie', 'treemap', 'sankey', 'heatmap', 'funnel'].includes(item.series.type),
        )
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'radar')) {
        const value = (data[0] as TooltipDataChunkRadar).category?.key ?? null;
        const formattedValue =
            !headerFormat || (value === null && headerFormat.type !== 'custom')
                ? undefined
                : getFormattedValue({value, format: headerFormat});
        return {value, formattedValue};
    }

    const yHeaderItem = data.find(
        (item) => getSeriesPlugin(item.series.type).tooltip.headerAxis === 'y',
    );
    const seriesYAxis = yHeaderItem ? getSeriesYAxis(yHeaderItem, yAxes) : undefined;
    const axis = yHeaderItem ? seriesYAxis : xAxis;
    const value = yHeaderItem
        ? getYRowData(yHeaderItem.data, seriesYAxis)
        : getXRowData(data[0]?.data, xAxis);
    const formattedValue =
        (value === null || value === undefined) &&
        (axis?.type === 'category' || headerFormat?.type !== 'custom')
            ? undefined
            : getFormattedValue({value, format: headerFormat});

    return {value, formattedValue};
};

export function getHoveredValues(args: {
    hovered: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxes?: ChartYAxis[];
}): HoveredValue[] {
    const {hovered, xAxis, yAxes} = args;

    return hovered.map((seriesItem) => {
        const {data, series} = seriesItem;
        const seriesYAxis = getSeriesYAxis(seriesItem, yAxes);
        const getPluginValue = getSeriesPlugin(series.type).tooltip.getValue;

        if (getPluginValue) {
            return getPluginValue({item: seriesItem, xAxis, yAxis: seriesYAxis});
        }

        switch (series.type) {
            case 'area':
            case 'line':
            case 'bar-x':
            case 'waterfall':
            case 'scatter':
            case 'x-range': {
                return getYRowData(data, seriesYAxis);
            }
            case 'bar-y': {
                return getXRowData(data, xAxis);
            }
            case 'pie':
            case 'radar':
            case 'heatmap':
            case 'treemap':
            case 'funnel': {
                const seriesData = data as PreparedPieSeries | TreemapSeriesData | RadarSeriesData;
                return seriesData.value;
            }
            case 'sankey': {
                const {target, data: source} = seriesItem as TooltipDataChunkSankey;
                return source.links.find((d) => d.name === target?.name)?.value;
            }
            default: {
                return undefined;
            }
        }
    });
}

export function getBuiltInAggregatedValue(args: {
    aggregation: ChartTooltipTotalsBuiltInAggregation;
    values: HoveredValue[];
}): number | undefined {
    const {aggregation, values} = args;

    switch (aggregation) {
        case 'sum':
            return values.reduce<number>((acc, value) => {
                return acc + (typeof value === 'number' ? value : 0);
            }, 0);
        default:
            return undefined;
    }
}

export function getBuiltInAggregationLabel(args: {
    aggregation: ChartTooltipTotalsBuiltInAggregation;
}): string {
    const {aggregation} = args;

    switch (aggregation) {
        case 'sum':
            return i18n('tooltip', 'label_totals_sum');
        default:
            return '';
    }
}

export function getPreparedAggregation(args: {
    hovered: TooltipDataChunk[];
    totals?: ChartTooltip['totals'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    yAxes?: ChartYAxis[];
}): ChartTooltipTotalsBuiltInAggregation | (() => ChartTooltipTotalsAggregationValue) {
    const {hovered, totals, xAxis, yAxis, yAxes} = args;

    const aggregation = totals?.aggregation;

    if (typeof aggregation === 'string') {
        return aggregation;
    }

    if (typeof aggregation === 'function') {
        return () => aggregation({hovered, xAxis, yAxis, yAxes});
    }

    return 'sum';
}

interface SortHoveredArgs {
    hovered: TooltipDataChunk[];
    sorting?: ChartTooltip['sorting'];
    xAxis?: ChartXAxis | null;
    yAxes?: ChartYAxis[];
    values?: HoveredValue[];
}

export function getPreparedHovered(args: SortHoveredArgs) {
    const values = getHoveredValues(args);
    const valuesByChunk = new Map(args.hovered.map((item, index) => [item, values[index]]));
    const hovered = getSortedHovered({...args, values});
    return {hovered, values: hovered.map((item) => valuesByChunk.get(item))};
}

export function getSortedHovered(args: SortHoveredArgs): TooltipDataChunk[] {
    const {hovered, sorting, xAxis, yAxes} = args;

    if (!sorting) {
        return hovered;
    }

    if (typeof sorting === 'function') {
        return [...hovered].sort(sorting);
    }

    switch (sorting.key) {
        case 'value': {
            const values = args.values ?? getHoveredValues({hovered, xAxis, yAxes});
            const direction = sorting.direction ?? 'asc';

            const compareValue = (a: HoveredValue, b: HoveredValue): number => {
                const aNil = a === null || a === undefined;
                const bNil = b === null || b === undefined;

                if (aNil && bNil) {
                    return 0;
                }

                if (aNil) {
                    return -1;
                }

                if (bNil) {
                    return 1;
                }

                if (typeof a === 'number' && typeof b === 'number') {
                    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : -1;
                    if (Number.isNaN(b)) return 1;
                    return a - b;
                }

                if (typeof a === 'number') return -1;
                if (typeof b === 'number') return 1;

                return String(a).localeCompare(String(b));
            };

            const indices = hovered.map((_, i) => i);

            indices.sort((i, j) =>
                direction === 'asc'
                    ? compareValue(values[i], values[j])
                    : compareValue(values[j], values[i]),
            );

            return indices.map((i) => hovered[i]);
        }
        default: {
            return hovered;
        }
    }
}
