import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import type {TooltipDataChunkTreemap} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedSeriesOptions} from '../../../series/types';
import {renderDataLabels} from '../shared/data-labels';

import type {PreparedSankeyData} from './types';

const b = block('sankey');

export function renderSankey(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedSankeyData,
    _seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();

    // nodes
    svgElement
        .append('g')
        .selectAll()
        .data(preparedData.nodes)
        .join('rect')
        .attr('x', (d) => d.x0)
        .attr('y', (d) => d.y0)
        .attr('height', (d) => d.y1 - d.y0)
        .attr('width', (d) => d.x1 - d.x0)
        .attr('fill', (d) => d.color);

    // links
    svgElement
        .append('g')
        .attr('fill', 'none')
        .selectAll()
        .data(preparedData.links)
        .join('g')
        .append('path')
        .attr('stroke-opacity', (d) => d.opacity)
        .attr('d', (d) => d.path)
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', (d) => d.strokeWidth);

    // dataLabels
    renderDataLabels({
        container: svgElement.append('g'),
        data: preparedData.labels,
        className: b('label'),
    }).attr('dy', '0.35em');

    const eventName = `hover-shape.sankey`;

    dispatcher?.on(eventName, (_data?: TooltipDataChunkTreemap[]) => {
        // no-op hover handler
    });

    return () => {
        dispatcher?.on(eventName, null);
    };
}
