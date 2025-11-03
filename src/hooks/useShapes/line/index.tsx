import React from 'react';

import type {BaseType, Dispatch} from 'd3';
import {color, line as lineGenerator, select} from 'd3';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkLine} from '../../../types';
import {block, filterOverlappingLabels, getLineDashArray} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
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

import type {MarkerData, PointData, PreparedLineData} from './types';

const b = block('line');

type Args = {
    preparedData: PreparedLineData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
    clipPathId: string;
    dispatcher?: Dispatch<object>;
};

export const LineSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const hoveredDataRef = React.useRef<TooltipDataChunkLine[] | null | undefined>(null);
    const plotRef = React.useRef<SVGGElement>(null);
    const markersRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!plotRef.current || !markersRef.current) {
            return () => {};
        }

        const plotSvgElement = select(plotRef.current);
        const markersSvgElement = select(markersRef.current);
        const hoverOptions = get(seriesOptions, 'line.states.hover');
        const inactiveOptions = get(seriesOptions, 'line.states.inactive');

        const line = lineGenerator<PointData>()
            .x((d) => d.x)
            .y((d) => d.y);

        plotSvgElement.selectAll('*').remove();
        markersSvgElement.selectAll('*').remove();

        const lineSelection = plotSvgElement
            .selectAll('path')
            .data(preparedData)
            .join('path')
            .attr('d', (d) => line(d.points))
            .attr('fill', 'none')
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', (d) => d.width)
            .attr('stroke-linejoin', (d) => d.linecap)
            .attr('stroke-linecap', (d) => d.linecap)
            .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.width))
            .attr('opacity', (d) => d.opacity)
            .attr('cursor', (d) => d.series.cursor);

        let dataLabels = preparedData.reduce((acc, d) => {
            return acc.concat(d.labels);
        }, [] as LabelData[]);

        if (!preparedData[0]?.series.dataLabels.allowOverlap) {
            dataLabels = filterOverlappingLabels(dataLabels);
        }

        const labelsSelection = plotSvgElement
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

        const markers = preparedData.reduce<MarkerData[]>((acc, d) => acc.concat(d.markers), []);
        const markerSelection = markersSvgElement
            .selectAll('marker')
            .data(markers)
            .join('g')
            .call(renderMarker);

        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        function handleShapeHover(data?: TooltipDataChunkLine[]) {
            hoveredDataRef.current = data;
            const selected = data?.filter((d) => d.series.type === 'line') || [];
            const selectedDataItems = selected.map((d) => d.data);
            const selectedSeriesIds = selected.map((d) => d.series?.id);

            lineSelection.datum((d, index, list) => {
                const elementSelection = select<BaseType, PreparedLineData>(list[index]);

                const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.attr('stroke', (dSelection) => {
                        const initialColor = dSelection.color || '';
                        if (dSelection.hovered) {
                            return (
                                color(initialColor)
                                    ?.brighter(hoverOptions?.brightness)
                                    .toString() || initialColor
                            );
                        }
                        return initialColor;
                    });
                }

                return setActiveState<PreparedLineData>({
                    element: list[index],
                    state: inactiveOptions,
                    active: Boolean(
                        !inactiveEnabled ||
                            !selectedSeriesIds.length ||
                            selectedSeriesIds.includes(d.id),
                    ),
                    datum: d,
                });
            });

            labelsSelection.datum((d, index, list) => {
                return setActiveState<LabelData>({
                    element: list[index],
                    state: inactiveOptions,
                    active: Boolean(
                        !inactiveEnabled ||
                            !selectedSeriesIds.length ||
                            selectedSeriesIds.includes(d.series.id),
                    ),
                    datum: d,
                });
            });

            markerSelection.datum((d, index, list) => {
                const elementSelection = select<BaseType, MarkerData>(list[index]);

                const hovered = Boolean(hoverEnabled && selectedDataItems.includes(d.point.data));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.attr('visibility', getMarkerVisibility(d));
                    selectMarkerHalo(elementSelection).attr('visibility', getMarkerHaloVisibility);
                    selectMarkerSymbol(elementSelection).call(
                        setMarker,
                        hovered ? 'hover' : 'normal',
                    );
                }

                if (d.point.series.marker.states.normal.enabled) {
                    const isActive = Boolean(
                        !inactiveEnabled ||
                            !selectedSeriesIds.length ||
                            selectedSeriesIds.includes(d.point.series.id),
                    );
                    setActiveState<MarkerData>({
                        element: list[index],
                        state: inactiveOptions,
                        active: isActive,
                        datum: d,
                    });
                }
                return d;
            });
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on('hover-shape.line', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.line', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={plotRef} className={b()} clipPath={`url(#${clipPathId})`} />
            <g ref={markersRef} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
