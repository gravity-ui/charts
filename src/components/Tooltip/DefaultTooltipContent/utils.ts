import {create} from 'd3-selection';
import get from 'lodash/get';

import {TOOLTIP_SORT_PRESET} from '../../../constants';
import type {PreparedPieSeries} from '../../../hooks';
import {i18n} from '../../../i18n';
import type {
    ChartSeriesData,
    ChartTooltip,
    ChartTooltipSortComparator,
    ChartTooltipSortPreset,
    ChartTooltipTotalsAggregationValue,
    ChartTooltipTotalsBuiltInAggregation,
    ChartXAxis,
    ChartYAxis,
    RadarSeriesData,
    TooltipDataChunk,
    TooltipDataChunkRadar,
    TooltipDataChunkSankey,
    TreemapSeriesData,
    ValueFormat,
} from '../../../types';
import {getDataCategoryValue, getDefaultDateFormat} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import {appendLinePathElement} from '../../utils';

export type HoveredValue = string | number | null | undefined;

function getRowData(
    fieldName: 'x' | 'y',
    data: ChartSeriesData,
    axis?: ChartXAxis | ChartYAxis | null,
) {
    switch (axis?.type) {
        case 'category': {
            const categories = get(axis, 'categories', [] as string[]);
            return getDataCategoryValue({axisDirection: fieldName, categories, data});
        }
        default: {
            return get(data, fieldName);
        }
    }
}

export function getXRowData(data: ChartSeriesData, xAxis?: ChartXAxis | null) {
    return getRowData('x', data, xAxis);
}

function getYRowData(data: ChartSeriesData, yAxis?: ChartYAxis) {
    return getRowData('y', data, yAxis);
}

export function getDefaultValueFormat({
    axis,
    closestPointsRange,
}: {
    axis?: ChartXAxis | ChartYAxis | null;
    closestPointsRange?: number;
}): ValueFormat | undefined {
    switch (axis?.type) {
        case 'linear':
        case 'logarithmic': {
            return {
                type: 'number',
            };
        }
        case 'datetime': {
            return {
                type: 'date',
                format: getDefaultDateFormat(closestPointsRange),
            };
        }
        default:
            return undefined;
    }
}

export const getMeasureValue = ({
    data,
    xAxis,
    yAxis,
    headerFormat,
}: {
    data: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    headerFormat?: ChartTooltip['headerFormat'];
}) => {
    if (
        data.every((item) =>
            ['pie', 'treemap', 'waterfall', 'sankey', 'heatmap', 'funnel'].includes(
                item.series.type,
            ),
        )
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'radar')) {
        const value = (data[0] as TooltipDataChunkRadar).category?.key ?? null;
        return {value};
    }

    if (data.some((item) => item.series.type === 'bar-y')) {
        const value = getYRowData(data[0]?.data, yAxis);
        const formattedValue = getFormattedValue({
            value: getYRowData(data[0]?.data, yAxis),
            format: headerFormat,
        });
        return {value, formattedValue};
    }

    const value = getXRowData(data[0]?.data, xAxis);
    const formattedValue = getFormattedValue({
        value: getXRowData(data[0]?.data, xAxis),
        format: headerFormat,
    });

    return {value, formattedValue};
};

export function getHoveredValues(args: {
    hovered: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
}): HoveredValue[] {
    const {hovered, xAxis, yAxis} = args;

    return hovered.map((seriesItem) => {
        const {data, series} = seriesItem;

        switch (series.type) {
            case 'area':
            case 'line':
            case 'bar-x':
            case 'scatter': {
                return getYRowData(data, yAxis);
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
            case 'waterfall': {
                return getYRowData(data, yAxis);
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
}): ChartTooltipTotalsBuiltInAggregation | (() => ChartTooltipTotalsAggregationValue) {
    const {hovered, totals, xAxis, yAxis} = args;

    const aggregation = totals?.aggregation;

    if (typeof aggregation === 'string') {
        return aggregation;
    }

    if (typeof aggregation === 'function') {
        return () => aggregation({hovered, xAxis, yAxis});
    }

    return 'sum';
}

export function getSortedHovered(args: {
    hovered: TooltipDataChunk[];
    sort?: ChartTooltipSortPreset | ChartTooltipSortComparator;
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
}): TooltipDataChunk[] {
    const {hovered, sort, xAxis, yAxis} = args;

    if (!sort) {
        return hovered;
    }

    if (typeof sort === 'function') {
        return [...hovered].sort(sort);
    }

    const values = getHoveredValues({hovered, xAxis, yAxis});

    const compareValue = (a: HoveredValue, b: HoveredValue): number => {
        if (a === null && b === null) {
            return 0;
        }

        if (a === null) {
            return -1;
        }

        if (b === null) {
            return 1;
        }

        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        return String(a).localeCompare(String(b));
    };

    const indices = hovered.map((_, i) => i);

    indices.sort((i, j) => {
        switch (sort) {
            case TOOLTIP_SORT_PRESET.VALUE_ASC:
                return compareValue(values[i], values[j]);
            case TOOLTIP_SORT_PRESET.VALUE_DESC:
                return compareValue(values[j], values[i]);
            default:
                return 0;
        }
    });

    return indices.map((i) => hovered[i]);
}

export function getTooltipRowColorSymbol({
    series,
    color,
    height = 8,
    width = 16,
}: {
    color?: string;
    series?: TooltipDataChunk['series'];
    height?: number;
    width?: number;
}) {
    if (series?.type === 'line') {
        const colorSymbol = create('svg').attr('height', height).attr('width', width);
        const g = colorSymbol.append('g');
        appendLinePathElement({
            svgRootElement: g.node(),
            height,
            width,
            color,
            dashStyle: get(series, 'dashStyle'),
            lineWidth: get(series, 'lineWidth'),
        });

        return colorSymbol.node();
    }

    return null;
}
