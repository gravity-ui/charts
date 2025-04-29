import React from 'react';

import {color, curveLinearClosed, line, select} from 'd3';
import type {BaseType, Dispatch} from 'd3';
import get from 'lodash/get';

import type {TooltipDataChunkPie} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {setActiveState} from '../utils';

import type {PreparedRadarData, RadarPointData} from './types';

const b = block('radar');

type PrepareRadarSeriesArgs = {
    dispatcher: Dispatch<object>;
    series: PreparedRadarData[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    htmlLayout: HTMLElement | null;
};

export function RadarSeriesShapes(args: PrepareRadarSeriesArgs) {
    const {dispatcher, series: preparedData, seriesOptions, htmlLayout} = args;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();
        const pointSelector = `.${b('point')}`;
        const axisSelector = `.${b('axis')}`;

        const shapesSelection = svgElement
            .selectAll('radar')
            .data(preparedData)
            .join('g')
            .attr('id', (radarData) => radarData.id)
            .attr('class', b('item'))
            .attr('cursor', (radarData) => radarData.series.cursor);

        // Render axes
        shapesSelection
            .selectAll(axisSelector)
            .data((radarData) => radarData.axes)
            .join('line')
            .attr('class', b('axis'))
            .attr('x1', (d) => d.x1)
            .attr('y1', (d) => d.y1)
            .attr('x2', (d) => d.x2)
            .attr('y2', (d) => d.y2)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);

        // Render radar area
        shapesSelection.each(function (radarData) {
            const radarPoints = radarData.points;
            if (radarPoints.length < 3) return; // Need at least 3 points for an area

            const radarLine = line<RadarPointData>()
                .x((d) => d.x)
                .y((d) => d.y)
                .curve(curveLinearClosed);

            select(this)
                .append('path')
                .attr('class', b('area'))
                .attr('d', radarLine(radarPoints))
                .attr('fill', radarData.series.color)
                .attr('fill-opacity', radarData.fillOpacity)
                .attr('stroke', radarData.borderColor || radarData.series.color)
                .attr('stroke-width', radarData.borderWidth);
        });

        // Render points
        shapesSelection
            .selectAll(pointSelector)
            .data((radarData) => radarData.points)
            .join('circle')
            .attr('class', b('point'))
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 4)
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.opacity);

        // Render labels
        shapesSelection
            .selectAll('text')
            .data((radarData) => radarData.labels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        // Handle hover events
        const eventName = `hover-shape.radar`;
        const hoverOptions = get(seriesOptions, 'radar.states.hover', {
            enabled: true,
            brightness: 0.3,
        });
        const inactiveOptions = get(seriesOptions, 'radar.states.inactive', {
            enabled: true,
            opacity: 0.5,
        });

        dispatcher.on(eventName, (data?: TooltipDataChunkPie[]) => {
            const selectedSeriesId = data?.[0]?.series?.id;
            const hoverEnabled = hoverOptions?.enabled;
            const inactiveEnabled = inactiveOptions?.enabled;

            shapesSelection.datum((_d, index, list) => {
                const radarSelection = select<BaseType, PreparedRadarData>(list[index]);

                radarSelection
                    .selectAll<BaseType, RadarPointData>(pointSelector)
                    .datum((d, i, elements) => {
                        const hovered = Boolean(hoverEnabled && d.series.id === selectedSeriesId);
                        if (d.hovered !== hovered) {
                            d.hovered = hovered;
                            select(elements[i]).attr('fill', () => {
                                const initialColor = d.color;
                                if (d.hovered) {
                                    return (
                                        color(initialColor)
                                            ?.brighter(hoverOptions.brightness)
                                            .toString() || initialColor
                                    );
                                }
                                return initialColor;
                            });
                        }

                        setActiveState<RadarPointData>({
                            element: elements[i],
                            state: inactiveOptions,
                            active: Boolean(
                                !inactiveEnabled ||
                                    !selectedSeriesId ||
                                    selectedSeriesId === d.series.id,
                            ),
                            datum: d,
                        });

                        return d;
                    });
            });
        });

        return () => {
            dispatcher.on(eventName, null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlElements = preparedData.map((d) => d.htmlLabels).flat();

    return (
        <React.Fragment>
            <g ref={ref} className={b()} style={{zIndex: 9}} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
