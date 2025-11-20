import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';

import type {TooltipDataChunkHeatmap} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedHeatmapData} from './types';

export {prepareHeatmapData} from './prepare-data';
export * from './types';

const b = block('heatmap');

type Args = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedHeatmapData;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const HeatmapSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const hoveredDataRef = React.useRef<TooltipDataChunkHeatmap[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
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
        svgElement
            .selectAll('text')
            .data(preparedData.labels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        function handleShapeHover(data?: TooltipDataChunkHeatmap[]) {
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

        dispatcher?.on('hover-shape.heatmap', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.heatmap', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
