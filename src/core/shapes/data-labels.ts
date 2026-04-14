import type {Selection} from 'd3-selection';

import type {BaseTextStyle} from '../types/chart/base';

type RenderableLabelData = {
    text: string;
    x: number;
    y: number;
    textAnchor: 'start' | 'end' | 'middle';
    style: BaseTextStyle;
};

export function renderDataLabels<T extends RenderableLabelData>(args: {
    container: Selection<SVGGElement, unknown, null, undefined>;
    data: T[];
    className: string;
}): Selection<SVGTextElement, T, SVGGElement, unknown> {
    const {container, data, className} = args;

    return container
        .selectAll<SVGTextElement, T>('text')
        .data(data)
        .join('text')
        .html((d) => d.text)
        .attr('class', className)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('text-anchor', (d) => d.textAnchor)
        .style('font-size', (d) => d.style.fontSize)
        .style('font-weight', (d) => d.style.fontWeight || null)
        .style('fill', (d) => d.style.fontColor || null);
}
