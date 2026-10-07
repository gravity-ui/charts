import {i18n} from '~core/i18n';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import {getTooltipHeader, getTooltipYAxis} from '~core/tooltip/header';
import {getDefaultTooltipValue} from '~core/tooltip/utils';
import {getFormattedValue} from '~core/utils/format';

import type {
    ChartTooltip,
    ChartTooltipTotalsAggregationValue,
    ChartTooltipTotalsBuiltInAggregation,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
} from '../../../types';

export type HoveredValue = string | number | null | undefined;

interface PrepareHoveredArgs {
    hovered: TooltipDataChunk[];
    sorting?: ChartTooltip['sorting'];
    xAxis?: ChartXAxis | null;
    yAxes?: ChartYAxis[];
}

export interface PreparedHovered {
    hovered: TooltipDataChunk[];
    values: HoveredValue[];
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
    const selected = getTooltipHeader(data);
    if (!selected) {
        return null;
    }
    const yAxis = getTooltipYAxis(selected.item.series, yAxes);
    const value = selected.header.getValue({item: selected.item, xAxis, yAxis});
    const axis = selected.header.axis && (selected.header.axis === 'y' ? yAxis : xAxis);
    const formattedValue =
        (selected.header.requiresFormat && !headerFormat) ||
        ((value === null || value === undefined) &&
            (axis?.type === 'category' || headerFormat?.type !== 'custom'))
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

    return hovered.map((item) => {
        const getValue =
            getSeriesPlugin(item.series.type).tooltip.getValue ?? getDefaultTooltipValue;
        return getValue({item, xAxis, yAxis: getTooltipYAxis(item.series, yAxes)});
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

export function getPreparedHovered(args: PrepareHoveredArgs): PreparedHovered {
    const {hovered, sorting, xAxis, yAxes} = args;
    const values = getHoveredValues({hovered, xAxis, yAxes});
    const indices = hovered.map((_, i) => i);
    const getResult = (): PreparedHovered => ({
        hovered: indices.map((i) => hovered[i]),
        values: indices.map((i) => values[i]),
    });

    if (!sorting) {
        return {hovered, values};
    }

    if (typeof sorting === 'function') {
        indices.sort((i, j) => sorting(hovered[i], hovered[j]));
        return getResult();
    }

    switch (sorting.key) {
        case 'value': {
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

            indices.sort((i, j) =>
                direction === 'asc'
                    ? compareValue(values[i], values[j])
                    : compareValue(values[j], values[i]),
            );

            return getResult();
        }
        default: {
            return {hovered, values};
        }
    }
}
