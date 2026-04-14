import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import type {TooltipDataChunkHeatmap} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {renderDataLabels} from '../data-labels';

import type {PreparedHeatmapData} from './types';

const b = block('heatmap');

export function renderHeatmap(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedHeatmapData,
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    const hoverOptions = seriesOptions.heatmap?.states?.hover;
    svgElement.selectAll('*').remove();

    // heatmap cells
    const cellsSelection = svgElement
        .selectAll('rect')
        .data(preparedData.items)
        .join('rect')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('height', (d) => d.height)
        .attr('width', (d) => d.width)
        .attr('fill', (d) => d.color)
        .attr('stroke', (d) => d.borderColor)
        .attr('stroke-width', (d) => d.borderWidth);

    // dataLabels
    renderDataLabels({
        container: svgElement,
        data: preparedData.labels,
        className: b('label'),
    });

    function handleShapeHover(data?: TooltipDataChunkHeatmap[]) {
        const hoverEnabled = hoverOptions?.enabled;

        if (hoverEnabled) {
            const hovered = data?.reduce((acc, d) => {
                acc.add(d.data);
                return acc;
            }, new Set());

            cellsSelection.attr('fill', (d) => {
                const fillColor = d.color;
                if (hovered?.has(d.data)) {
                    return (
                        color(fillColor)?.brighter(hoverOptions.brightness).toString() || fillColor
                    );
                }
                return fillColor;
            });
        }
    }

    dispatcher?.on('hover-shape.heatmap', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.heatmap', null);
    };
}
