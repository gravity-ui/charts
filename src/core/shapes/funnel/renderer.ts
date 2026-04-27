import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import type {TooltipDataChunkFunnel} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {getLineDashArray} from '../../utils';
import {renderDataLabels} from '../data-labels';

import type {PreparedFunnelData} from './types';

const b = block('funnel');

export function renderFunnel(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedFunnelData,
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    const hoverOptions = seriesOptions.funnel?.states?.hover;
    svgElement.selectAll('*').remove();

    // funnel levels
    const cellsSelection = svgElement
        .selectAll<SVGPolygonElement, (typeof preparedData.items)[number]>('polygon')
        .data(preparedData.items)
        .join('polygon')
        .attr('points', (d) => d.points.map((p) => p.join(',')).join(' '))
        .attr('fill', (d) => d.color)
        .attr('stroke', (d) => d.borderColor)
        .attr('stroke-width', (d) => d.borderWidth);

    // connectors
    const connectorAreaClassName = b('connector-area');
    svgElement
        .selectAll(`.${connectorAreaClassName}`)
        .data(preparedData.connectors)
        .join('path')
        .attr('d', (d) => d.areaPath.toString())
        .attr('class', connectorAreaClassName)
        .attr('fill', (d) => d.areaColor)
        .attr('opacity', (d) => d.areaOpacity);

    const connectorLineClassName = b('connector-line');
    const connectorLines = svgElement
        .selectAll(`.${connectorLineClassName}`)
        .data(preparedData.connectors)
        .join('g')
        .attr('class', connectorLineClassName)
        .attr('stroke', (d) => d.lineColor)
        .attr('stroke-width', (d) => d.lineWidth)
        .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.lineWidth))
        .attr('fill', 'none')
        .attr('opacity', (d) => d.lineOpacity);
    connectorLines.append('path').attr('d', (d) => d.linePath[0].toString());
    connectorLines.append('path').attr('d', (d) => d.linePath[1].toString());

    // dataLabels
    renderDataLabels({
        container: svgElement,
        data: preparedData.svgLabels,
        className: b('label'),
    });

    function handleShapeHover(data?: TooltipDataChunkFunnel[]) {
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

    dispatcher?.on('hover-shape.funnel', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.funnel', null);
    };
}
