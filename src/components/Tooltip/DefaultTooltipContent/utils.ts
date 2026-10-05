import {i18n} from '~core/i18n';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import {getTooltipAxisValue} from '~core/tooltip/utils';
import {getFormattedValue} from '~core/utils/format';

import type {
    ChartSeriesData,
    ChartTooltip,
    ChartTooltipTotalsAggregationValue,
    ChartTooltipTotalsBuiltInAggregation,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkRadar,
} from '../../../types';

export type HoveredValue = string | number | null | undefined;

export function getXRowData(data: ChartSeriesData, xAxis?: ChartXAxis | null) {
    return getTooltipAxisValue(data, 'x', xAxis);
}

function getYRowData(data: ChartSeriesData, yAxis?: ChartYAxis) {
    return getTooltipAxisValue(data, 'y', yAxis);
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
            ['pie', 'treemap', 'sankey', 'heatmap', 'funnel'].includes(item.series.type),
        )
    ) {
        return null;
    }

    if (data.some((item) => item.series.type === 'radar')) {
        const value = (data[0] as TooltipDataChunkRadar).category?.key ?? null;
        return {value};
    }

    if (data.some((item) => ['bar-y', 'x-range'].includes(item.series.type))) {
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

    return hovered.map((item) =>
        getSeriesPlugin(item.series.type).tooltip.getValue({item, xAxis, yAxis}),
    );
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
    sorting?: ChartTooltip['sorting'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
}): TooltipDataChunk[] {
    const {hovered, sorting, xAxis, yAxis} = args;

    if (!sorting) {
        return hovered;
    }

    if (typeof sorting === 'function') {
        return [...hovered].sort(sorting);
    }

    switch (sorting.key) {
        case 'value': {
            const values = getHoveredValues({hovered, xAxis, yAxis});
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
                    return a - b;
                }

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
