import {create} from 'd3-selection';

import type {DashStyle} from '../constants';
import {getRectPath} from '../shapes/utils';
import type {ChartTooltip, ChartXAxis, ChartYAxis, ValueFormat} from '../types';
import {createLineSymbol, getDefaultDateFormat} from '../utils';

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

export function getTooltipColorSymbol(color: string) {
    const colorSymbol = create('svg')
        .attr('height', TOOLTIP_COLOR_SYMBOL_HEIGHT)
        .attr('width', TOOLTIP_COLOR_SYMBOL_WIDTH);
    const g = colorSymbol.append('g');
    g.append('path')
        .attr('d', () => {
            const p = getRectPath({
                x: 0,
                y: 0,
                width: TOOLTIP_COLOR_SYMBOL_WIDTH,
                height: TOOLTIP_COLOR_SYMBOL_HEIGHT,
                borderRadius: 2,
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
