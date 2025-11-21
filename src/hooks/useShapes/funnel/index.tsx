import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';

import type {TooltipDataChunkFunnel} from '../../../types';
import {block, getLineDashArray} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';

import type {PreparedFunnelData} from './types';

export {prepareFunnelData} from './prepare-data';
export * from './types';

const b = block('funnel');

type Args = {
    dispatcher?: Dispatch<object>;
    preparedData: PreparedFunnelData;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const FunnelSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions} = args;
    const hoveredDataRef = React.useRef<TooltipDataChunkFunnel[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = seriesOptions.funnel?.states?.hover;
        svgElement.selectAll('*').remove();

        // funnel levels
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
        svgElement
            .selectAll('text')
            .data(preparedData.svgLabels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        function handleShapeHover(data?: TooltipDataChunkFunnel[]) {
            hoveredDataRef.current = data;
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
                            color(fillColor)?.brighter(hoverOptions.brightness).toString() ||
                            fillColor
                        );
                    }
                    return fillColor;
                });
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on('hover-shape.funnel', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.funnel', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
        </React.Fragment>
    );
};
