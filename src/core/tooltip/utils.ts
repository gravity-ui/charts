import {create} from 'd3-selection';
import get from 'lodash/get';

import type {DashStyle} from '../constants';
import type {GetTooltipValueArgs} from '../series/plugin';
import {getRectPath} from '../shapes/utils';
import type {ChartSeriesData, ChartTooltip, ChartXAxis, ChartYAxis, ValueFormat} from '../types';
import {createLineSymbol, getDataCategoryValue, getDefaultDateFormat} from '../utils';

export function getTooltipAxisValue(
    data: ChartSeriesData,
    axisDirection: 'x' | 'y',
    axis?: ChartXAxis | ChartYAxis | null,
): string | number | null | undefined {
    if (axis?.type === 'category') {
        const categories = get(axis, 'categories', [] as string[]);
        return getDataCategoryValue({axisDirection, categories, data});
    }

    return get(data, axisDirection);
}

export function getTooltipXValue({item, xAxis}: GetTooltipValueArgs) {
    return getTooltipAxisValue(item.data, 'x', xAxis);
}

export function getTooltipYValue({item, yAxis}: GetTooltipValueArgs) {
    return getTooltipAxisValue(item.data, 'y', yAxis);
}

interface ScalarTooltipValueArgs {
    item: {
        data: {value?: number | null};
    };
}

export function getTooltipScalarValue({item}: ScalarTooltipValueArgs) {
    return item.data.value;
}

export function getDefaultTooltipValue(args: GetTooltipValueArgs) {
    return 'value' in args.item.data
        ? getTooltipScalarValue({item: {data: args.item.data}})
        : getTooltipYValue(args);
}

export function getDefaultValueFormat({
    axis,
    closestPointsRange,
    dateTimeLabelFormats,
}: {
    axis?: ChartXAxis | ChartYAxis | null;
    closestPointsRange?: number;
    dateTimeLabelFormats?: ChartTooltip['dateTimeLabelFormats'];
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
                format: getDefaultDateFormat(closestPointsRange, dateTimeLabelFormats),
            };
        }
        default:
            return undefined;
    }
}

const TOOLTIP_COLOR_SYMBOL_WIDTH = 16;
const TOOLTIP_COLOR_SYMBOL_HEIGHT = 8;

export function getTooltipColorSymbol({
    color,
    width = TOOLTIP_COLOR_SYMBOL_WIDTH,
    height = TOOLTIP_COLOR_SYMBOL_HEIGHT,
    borderRadius = 2,
}: {
    color: string;
    width?: number;
    height?: number;
    borderRadius?: number;
}) {
    const colorSymbol = create('svg').attr('height', height).attr('width', width);
    const g = colorSymbol.append('g');
    g.append('path')
        .attr('d', () => {
            const p = getRectPath({
                x: 0,
                y: 0,
                width,
                height,
                borderRadius,
            });

            return p.toString();
        })
        .attr('fill', color);

    return colorSymbol.node()?.outerHTML ?? '';
}

export function getTooltipLineSymbol({
    color,
    dashStyle,
    lineWidth = 1,
}: {
    color: string;
    dashStyle?: DashStyle;
    lineWidth?: number;
}) {
    const svg = create('svg')
        .attr('height', TOOLTIP_COLOR_SYMBOL_HEIGHT)
        .attr('width', TOOLTIP_COLOR_SYMBOL_WIDTH);
    createLineSymbol({
        container: svg.append('g').node(),
        width: TOOLTIP_COLOR_SYMBOL_WIDTH,
        height: TOOLTIP_COLOR_SYMBOL_HEIGHT,
        color,
        dashStyle,
        lineWidth,
    });
    return svg.node()?.outerHTML ?? '';
}
