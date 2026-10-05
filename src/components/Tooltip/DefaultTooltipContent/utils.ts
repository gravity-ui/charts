import {i18n} from '~core/i18n';
import type {SeriesPlugin} from '~core/series/plugin';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
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

interface TooltipHeaderSelection {
    item: TooltipDataChunk;
    header: NonNullable<SeriesPlugin['tooltip']['header']>;
}

interface PrepareHoveredArgs {
    hovered: TooltipDataChunk[];
    sorting?: ChartTooltip['sorting'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
}

export interface PreparedHovered {
    hovered: TooltipDataChunk[];
    values: HoveredValue[];
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
    let selected: TooltipHeaderSelection | undefined;
    for (const item of data) {
        const header = getSeriesPlugin(item.series.type).tooltip.header;
        if (header && (!selected || (header.priority ?? 0) > (selected.header.priority ?? 0))) {
            selected = {item, header};
        }
    }
    if (!selected) {
        return null;
    }
    const value = selected.header.getValue({item: selected.item, xAxis, yAxis});
    return {value, formattedValue: getFormattedValue({value, format: headerFormat})};
};

export function getHoveredValues(args: {
    hovered: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
}): HoveredValue[] {
    const {hovered, xAxis, yAxis} = args;

    return hovered.map((item) => {
        const getValue =
            getSeriesPlugin(item.series.type).tooltip.getValue ?? getDefaultTooltipValue;
        return getValue({item, xAxis, yAxis});
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

export function getSortedHovered(args: PrepareHoveredArgs): TooltipDataChunk[] {
    if (!args.sorting) {
        return args.hovered;
    }
    if (typeof args.sorting === 'function') {
        return [...args.hovered].sort(args.sorting);
    }
    return getPreparedHovered(args).hovered;
}

export function getPreparedHovered(args: PrepareHoveredArgs): PreparedHovered {
    const {hovered, sorting, xAxis, yAxis} = args;
    const values = getHoveredValues({hovered, xAxis, yAxis});
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
                    return a - b;
                }

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
