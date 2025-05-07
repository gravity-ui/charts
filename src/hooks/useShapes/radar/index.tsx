import React from 'react';

import {color, line, select} from 'd3';
import type {BaseType, Dispatch} from 'd3';
import get from 'lodash/get';

import type {TooltipDataChunkRadar} from '../../../types';
import {block} from '../../../utils';
import type {PreparedRadarSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {
    getMarkerHaloVisibility,
    getMarkerVisibility,
    renderMarker,
    selectMarkerHalo,
    selectMarkerSymbol,
    setMarker,
} from '../marker';
import {setActiveState} from '../utils';

import type {PreparedRadarData, RadarMarkerData, RadarShapeData} from './types';

const b = block('radar');

type PrepareRadarSeriesArgs = {
    dispatcher: Dispatch<object>;
    series: PreparedRadarData[];
    seriesOptions: PreparedSeriesOptions;
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
        const areaSelector = `.${b('area')}`;

        const radarSelection = svgElement
            .selectAll('radar')
            .data(preparedData)
            .join('g')
            .attr('id', (radarData) => radarData.id)
            .attr('class', b('item'))
            .attr('cursor', (radarData) => radarData.cursor);

        // render axes
        radarSelection
            .selectAll(`.${b('axis')}`)
            .data((radarData) => radarData.axes)
            .join('line')
            .attr('class', b('axis'))
            .attr('x1', (d) => d.radar.center[0])
            .attr('y1', (d) => d.radar.center[1])
            .attr('x2', (d) => d.point[0])
            .attr('y2', (d) => d.point[1])
            .attr('stroke', (d) => d.strokeColor)
            .attr('stroke-width', (d) => d.strokeWidth);

        // render grid lines
        radarSelection
            .selectAll(`.${b('grid')}`)
            .data((radarData) => radarData.grid)
            .join('path')
            .attr('class', b('grid'))
            .attr('d', (d) => `${line()(d.path)} Z`)
            .attr('fill', 'none')
            .attr('stroke', (d) => d.strokeColor)
            .attr('stroke-width', (d) => d.strokeWidth);

        // render radar area
        const shapesSelection = radarSelection
            .selectAll(areaSelector)
            .data((radarData) => radarData.shapes)
            .join('g')
            .attr('class', b('area'));

        shapesSelection
            .append('path')
            .attr('d', (d) => d.path)
            .attr('fill', (d) => d.color)
            .attr('fill-opacity', (d) => d.fillOpacity)
            .attr('stroke', (d) => d.borderColor)
            .attr('stroke-width', (d) => d.borderWidth);

        // render markers
        const markerSelection = shapesSelection
            .selectAll('marker')
            .data((radarData) => radarData.points)
            .join('g')
            .call(renderMarker);

        // Render labels
        radarSelection
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
        const hoverOptions = get(seriesOptions, 'radar.states.hover');
        const inactiveOptions = get(seriesOptions, 'radar.states.inactive');

        dispatcher.on(eventName, (data?: TooltipDataChunkRadar[]) => {
            const closest = data?.find((d) => d.closest);
            const selectedSeries = closest?.series as PreparedRadarSeries;
            const selectedSeriesData = closest?.data;
            const selectedSeriesId = selectedSeries?.id;
            const hoverEnabled = hoverOptions?.enabled;
            const inactiveEnabled = inactiveOptions?.enabled;

            shapesSelection.datum((d, i, elements) => {
                const hovered = Boolean(hoverEnabled && d.series?.id === selectedSeriesId);

                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    select(elements[i]).attr('fill', () => {
                        const initialColor = d.color;
                        if (d.hovered) {
                            return (
                                color(initialColor)
                                    ?.brighter(hoverOptions?.brightness)
                                    .toString() || initialColor
                            );
                        }
                        return initialColor;
                    });

                    if (hovered) {
                        select(elements[i]).raise();
                    }
                }

                setActiveState<RadarShapeData>({
                    element: elements[i],
                    state: inactiveOptions,
                    active: Boolean(
                        !inactiveEnabled || !selectedSeriesId || selectedSeriesId === d.series.id,
                    ),
                    datum: d,
                });

                markerSelection.datum((markerData, index, markers) => {
                    const hoveredState = Boolean(
                        hoverEnabled && markerData.data === selectedSeriesData,
                    );

                    if (markerData.hovered !== hoveredState) {
                        markerData.hovered = hoveredState;
                        const elementSelection = select<BaseType, RadarMarkerData>(markers[index]);

                        elementSelection.attr('visibility', getMarkerVisibility(markerData));
                        selectMarkerHalo(elementSelection).attr(
                            'visibility',
                            getMarkerHaloVisibility,
                        );
                        selectMarkerSymbol(elementSelection).call(
                            setMarker,
                            hoveredState ? 'hover' : 'normal',
                        );
                    }

                    return markerData;
                });

                return d;
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
