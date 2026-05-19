import {create} from 'd3-selection';

import {getRectPath} from '../shapes/utils';
import type {ChartTooltip, ChartXAxis, ChartYAxis, ValueFormat} from '../types';
import {getDefaultDateFormat} from '../utils';

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

export function getTooltipColorSymbol(color: string) {
    const width = 16;
    const height = 8;
    const colorSymbol = create('svg').attr('height', height).attr('width', width);
    const g = colorSymbol.append('g');
    g.append('path')
        .attr('d', () => {
            const p = getRectPath({
                x: 0,
                y: 0,
                width,
                height,
                borderRadius: 2,
            });

            return p.toString();
        })
        .attr('fill', color);

    return colorSymbol.node()?.outerHTML ?? '';
}
