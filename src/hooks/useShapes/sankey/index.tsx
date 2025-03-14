import React from 'react';

import {select} from 'd3';
import type {Dispatch} from 'd3';
import {sankeyLinkHorizontal} from 'd3-sankey';

import type {TooltipDataChunkTreemap} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedSankeyData} from './types';

const b = block('sankey');

type ShapeProps = {
    dispatcher: Dispatch<object>;
    preparedData: PreparedSankeyData;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const SankeySeriesShape = (props: ShapeProps) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const hoveredDataRef = React.useRef<TooltipDataChunkTreemap[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
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
            .attr('stroke-opacity', 0.75)
            .selectAll()
            .data(preparedData.links)
            .join('g')
            .append('path')
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', (d) => d.source.color)
            .attr('stroke-width', (d) => Math.max(1, d.width));

        // dataLabels
        svgElement
            .append('g')
            .selectAll()
            .data(preparedData.labels)
            .join('text')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', (d) => d.textAnchor)
            .text((d) => d.text);

        const eventName = `hover-shape.sankey`;
        // const hoverOptions = get(seriesOptions, 'treemap.states.hover');
        // const inactiveOptions = get(seriesOptions, 'treemap.states.inactive');

        function handleShapeHover(data?: TooltipDataChunkTreemap[]) {
            hoveredDataRef.current = data;
            // const hoverEnabled = hoverOptions?.enabled;
            // const inactiveEnabled = inactiveOptions?.enabled;
            // const hoveredData = data?.[0]?.data;
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher.on(eventName, handleShapeHover);

        return () => {
            dispatcher.on(eventName, null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
