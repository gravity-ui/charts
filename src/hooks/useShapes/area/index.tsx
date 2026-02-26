import React from 'react';

import type {BaseType, Dispatch} from 'd3';
import {area as areaGenerator, color, line as lineGenerator, select} from 'd3';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkArea} from '../../../types';
import {block, filterOverlappingLabels} from '../../../utils';
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

import type {MarkerData, MarkerPointData, PointData, PreparedAreaData} from './types';

const b = block('area');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedAreaData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const AreaSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const hoveredDataRef = React.useRef<TooltipDataChunkArea[] | null | undefined>(null);
    const plotRef = React.useRef<SVGGElement | null>(null);
    const markersRef = React.useRef<SVGGElement>(null);
    const hoverMarkersRef = React.useRef<SVGGElement>(null);

    const allowOverlapDataLabels = React.useMemo(() => {
        return preparedData.some((d) => d?.series.dataLabels.allowOverlap);
    }, [preparedData]);

    React.useEffect(() => {
        if (!plotRef.current || !markersRef.current) {
            return () => {};
        }

        const plotSvgElement = select(plotRef.current);
        const markersSvgElement = select(markersRef.current);
        const hoverMarkersSvgElement = select(hoverMarkersRef.current);
        const hoverOptions = get(seriesOptions, 'area.states.hover');
        const inactiveOptions = get(seriesOptions, 'area.states.inactive');

        const line = lineGenerator<PointData>()
            .x((d) => d.x)
            .defined((d) => d.y !== null)
            .y((d) => d.y as number);

        plotSvgElement.selectAll('*').remove();
        markersSvgElement.selectAll('*').remove();

        const shapeSelection = plotSvgElement
            .selectAll('shape')
            .data(preparedData)
            .join('g')
            .attr('class', b('series'))
            .attr('cursor', (d) => d.series.cursor);

        shapeSelection
            .append('path')
            .attr('class', b('line'))
            .attr('d', (d) => line(d.points))
            .attr('fill', 'none')
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', (d) => d.width)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round');

        const area = areaGenerator<PointData>()
            .defined((d) => d.y !== null)
            .x((d) => d.x)
            .y0((d) => d.y0)
            .y1((d) => d.y as number);
        shapeSelection
            .append('path')
            .attr('class', b('region'))
            .attr('d', (d) => area(d.points))
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.opacity);

        let dataLabels = preparedData.reduce((acc, d) => {
            return acc.concat(d.labels);
        }, [] as LabelData[]);

        if (!allowOverlapDataLabels) {
            dataLabels = filterOverlappingLabels(dataLabels);
        }

        const labelsSelection = plotSvgElement
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

        const markers = preparedData.reduce<MarkerData[]>((acc, d) => acc.concat(d.markers), []);
        const markerSelection = markersSvgElement
            .selectAll('marker')
            .data(markers)
            .join('g')
            .call(renderMarker);

        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        function handleShapeHover(data?: TooltipDataChunkArea[]) {
            hoveredDataRef.current = data;
            const selected = data?.filter((d) => d.series.type === 'area') || [];
            const selectedDataItems = selected.map((d) => d.data);
            const selectedSeriesIds = selected.map((d) => d.series?.id);

            shapeSelection.datum((d, index, list) => {
                const elementSelection = select<BaseType, PreparedAreaData>(list[index]);

                const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;

                    let strokeColor = d.color || '';
                    if (d.hovered) {
                        strokeColor =
                            color(strokeColor)?.brighter(hoverOptions?.brightness).toString() ||
                            strokeColor;
                    }

                    elementSelection.selectAll(`.${b('line')}`).attr('stroke', strokeColor);
                    elementSelection.selectAll(`.${b('region')}`).attr('fill', strokeColor);
                }

                return setActiveState<PreparedAreaData>({
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

            hoverMarkersSvgElement.selectAll('*').remove();

            if (hoverEnabled && selected.length > 0) {
                const hoverOnlyMarkers: MarkerData[] = [];

                for (const chunk of selected) {
                    const seriesData = preparedData.find((pd) => pd.id === chunk.series.id);

                    if (!seriesData) {
                        continue;
                    }

                    const {series} = seriesData;

                    if (
                        series.marker.states.normal.enabled ||
                        !series.marker.states.hover.enabled
                    ) {
                        continue;
                    }

                    const point = seriesData.points.find((p) => p.data === chunk.data);

                    if (!point || point.y === null) {
                        continue;
                    }

                    hoverOnlyMarkers.push({
                        point: point as MarkerPointData,
                        active: true,
                        hovered: true,
                        clipped: false,
                    });
                }

                if (hoverOnlyMarkers.length > 0) {
                    hoverMarkersSvgElement
                        .selectAll('g')
                        .data(hoverOnlyMarkers)
                        .join('g')
                        .call(renderMarker)
                        .each((_d, i, nodes) => {
                            selectMarkerSymbol(select<BaseType, MarkerData>(nodes[i])).call(
                                setMarker,
                                'hover',
                            );
                        });
                }
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on('hover-shape.area', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.area', null);
        };
    }, [allowOverlapDataLabels, dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        const items = preparedData.map((d) => d?.htmlElements).flat();
        if (allowOverlapDataLabels) {
            return {htmlElements: items};
        }

        return {htmlElements: filterOverlappingLabels(items)};
    }, [allowOverlapDataLabels, preparedData]);

    return (
        <React.Fragment>
            <g ref={plotRef} className={b()} clipPath={`url(#${clipPathId})`} />
            <g ref={markersRef} />
            <g ref={hoverMarkersRef} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
