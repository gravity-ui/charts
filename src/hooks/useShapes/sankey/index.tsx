import React from 'react';

import {select} from 'd3';
import type {Dispatch} from 'd3';

import type {TooltipDataChunkTreemap} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedSankeyData} from './types';

const b = block('sankey');

type ShapeProps = {
    preparedData: PreparedSankeyData;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
    dispatcher?: Dispatch<object>;
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
            .selectAll()
            .data(preparedData.links)
            .join('g')
            .append('path')
            .attr('stroke-opacity', (d) => d.opacity)
            .attr('d', (d) => d.path)
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', (d) => d.strokeWidth);

        // dataLabels
        svgElement
            .append('g')
            .selectAll()
            .data(preparedData.labels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', (d) => d.textAnchor)
            .attr('fill', (d) => d.style.fontColor ?? null);

        const eventName = `hover-shape.sankey`;

        function handleShapeHover(data?: TooltipDataChunkTreemap[]) {
            hoveredDataRef.current = data;
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on(eventName, handleShapeHover);

        return () => {
            dispatcher?.on(eventName, null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
