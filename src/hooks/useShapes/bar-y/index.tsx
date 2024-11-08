import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedBarYData} from './types';
export {prepareBarYData} from './prepare-data';

const b = block('d3-bar-y');

type Args = {
    dispatcher: Dispatch<object>;
    preparedData: PreparedBarYData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const BarYSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();
        const rectSelection = svgElement
            .selectAll('rect')
            .data(preparedData)
            .join('rect')
            .attr('class', b('segment'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height)
            .attr('width', (d) => d.width)
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.data.opacity || null)
            .attr('cursor', (d) => d.series.cursor);

        const dataLabels = preparedData.reduce<LabelData[]>((acc, d) => {
            if (d.label) {
                acc.push(d.label);
            }
            return acc;
        }, []);
        const labelSelection = svgElement
            .selectAll('text')
            .data(dataLabels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        const hoverOptions = get(seriesOptions, 'bar-y.states.hover');
        const inactiveOptions = get(seriesOptions, 'bar-y.states.inactive');

        dispatcher.on('hover-shape.bar-y', (data?: PreparedBarYData[]) => {
            if (hoverOptions?.enabled) {
                const hovered = data?.reduce((acc, d) => {
                    acc.add(d.data.y);
                    return acc;
                }, new Set());

                rectSelection.attr('fill', (d) => {
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
                rectSelection.attr('opacity', newOpacity);
                labelSelection.attr('opacity', newOpacity);
            }
        });

        return () => {
            dispatcher.on('hover-shape.bar-y', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
