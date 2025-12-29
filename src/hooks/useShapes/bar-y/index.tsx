import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {BarYShapesArgs, PreparedBarYData} from './types';
import {getAdjustedRectBorderPath, getAdjustedRectPath} from './utils';

export {prepareBarYData} from './prepare-data';

const b = block('bar-y');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: BarYShapesArgs;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function BarYSeriesShapes(args: Args) {
    const {
        dispatcher,
        preparedData: {shapes: preparedData, labels: dataLabels, htmlElements},
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const hoveredDataRef = React.useRef<PreparedBarYData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();
        const segmentSelection = svgElement
            .selectAll(`path.${b('segment')}`)
            .data(preparedData)
            .join('path')
            .attr('d', (d) => getAdjustedRectPath(d))
            .attr('class', b('segment'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height)
            .attr('width', (d) => d.width)
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.data.opacity || null)
            .attr('cursor', (d) => d.series.cursor);

        const borderSelection = svgElement
            .selectAll(`path.${b('segment-border')}`)
            .data(preparedData.filter((d) => d.borderWidth > 0))
            .join('path')
            .attr('d', (d) => getAdjustedRectBorderPath(d))
            .attr('class', b('segment-border'))
            .attr('fill', (d) => d.borderColor)
            .attr('fill-rule', 'evenodd')
            .attr('opacity', (d) => d.data.opacity || null)
            .attr('pointer-events', 'none');

        const labelSelection = svgElement
            .selectAll('text')
            .data(dataLabels)
            .join('text')
            .html((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        const hoverOptions = get(seriesOptions, 'bar-y.states.hover');
        const inactiveOptions = get(seriesOptions, 'bar-y.states.inactive');

        function handleShapeHover(data?: PreparedBarYData[]) {
            hoveredDataRef.current = data;

            if (hoverOptions?.enabled) {
                const hovered = data?.reduce((acc, d) => {
                    acc.add(d.data.y);
                    return acc;
                }, new Set());

                segmentSelection.attr('fill', (d) => {
                    const fillColor = d.color;

                    if (hovered?.has(d.data.y)) {
                        return (
                            color(fillColor)?.brighter(hoverOptions.brightness).toString() ||
                            fillColor
                        );
                    }

                    return fillColor;
                });
            }

            if (inactiveOptions?.enabled) {
                const hoveredSeries = data?.map((d) => d.series.id);
                const newOpacity = (d: PreparedBarYData | LabelData) => {
                    if (hoveredSeries?.length && !hoveredSeries.includes(d.series.id)) {
                        return inactiveOptions.opacity || null;
                    }

                    return null;
                };
                segmentSelection.attr('opacity', newOpacity);
                borderSelection.attr('opacity', newOpacity);
                labelSelection.attr('opacity', newOpacity);
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on('hover-shape.bar-y', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.bar-y', null);
        };
    }, [dataLabels, dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
