import type {BaseType, Selection, ValueFn} from 'd3-selection';

import type {BaseTextStyle} from '../types/chart/base';

interface RenderableLabelData {
    text: string;
    lines?: string[];
    lineHeight?: number;
    x: number;
    y: number;
    textAnchor: 'start' | 'end' | 'middle';
    style: BaseTextStyle;
}

/**
 * Replaces all contents of the label containers. Render stack labels into a shared
 * container only after this call, otherwise they will be removed.
 */
export function renderDataLabels<T extends RenderableLabelData, Datum>(args: {
    /** Dedicated label groups whose contents are replaced on each render. */
    container: Selection<SVGGElement, Datum, BaseType, unknown>;
    data: T[] | ValueFn<SVGGElement, Datum, T[]>;
    className: string;
}): Selection<SVGTextElement, T, SVGGElement, Datum> {
    const {container, data, className} = args;

    container.selectAll('*').remove();

    return container
        .selectAll<SVGTextElement, T>('text')
        .data(data)
        .join('text')
        .html((d) => {
            if (d.lines?.length) {
                return d.lines
                    .map(
                        (line, i) =>
                            `<tspan x="${d.x}" dy="${i === 0 ? 0 : (d.lineHeight ?? 0)}">${line}</tspan>`,
                    )
                    .join('');
            }
            return d.text;
        })
        .attr('class', className)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('text-anchor', (d) => d.textAnchor)
        .style('font-size', (d) => d.style.fontSize)
        .style('font-weight', (d) => d.style.fontWeight || null)
        .style('fill', (d) => d.style.fontColor || null);
}
