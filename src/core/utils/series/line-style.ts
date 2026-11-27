import {select} from 'd3-selection';
import {line} from 'd3-shape';

import type {DashStyle} from '../../constants';

const linePathGenerator = line<{x: number; y: number}>()
    .x((d) => d.x)
    .y((d) => d.y);

export function createLineSymbol({
    container,
    width,
    height,
    x = 0,
    color = '',
    lineWidth = 1,
    dashStyle,
    className,
}: {
    container: SVGGElement | null;
    width: number;
    height: number;
    x?: number;
    color?: string;
    lineWidth?: number;
    dashStyle?: DashStyle;
    className?: string;
}) {
    const selection = select(container);
    const y = height / 2;
    const path = selection
        .append('path')
        .attr(
            'd',
            linePathGenerator([
                {x, y},
                {x: x + width, y},
            ]),
        )
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', lineWidth)
        .attr('class', className ?? null);

    if (dashStyle) {
        path.attr('stroke-dasharray', getLineDashArray(dashStyle, lineWidth));
    }

    return selection;
}

export function getLineDashArray(dashStyle: DashStyle, strokeWidth = 2) {
    const value = dashStyle.toLowerCase();

    const arrayValue = value
        .replace('shortdashdotdot', '3,1,1,1,1,1,')
        .replace('shortdashdot', '3,1,1,1')
        .replace('shortdot', '1,1,')
        .replace('shortdash', '3,1,')
        .replace('longdash', '8,3,')
        .replace(/dot/g, '1,3,')
        .replace('dash', '4,3,')
        .replace(/,$/, '')
        .split(',')
        .map((part) => {
            return `${parseInt(part, 10) * strokeWidth}`;
        });

    return arrayValue.join(',').replace(/NaN/g, 'none');
}
