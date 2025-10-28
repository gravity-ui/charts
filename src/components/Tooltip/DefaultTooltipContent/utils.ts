import get from 'lodash/get';

import type {PreparedPieSeries} from '../../../hooks';
import {i18n} from '../../../i18n';
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
    ValueFormat,
} from '../../../types';
import {getDataCategoryValue, getDefaultDateFormat} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';

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
            ['pie', 'treemap', 'waterfall', 'sankey', 'heatmap'].includes(item.series.type),
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
            case 'treemap': {
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
