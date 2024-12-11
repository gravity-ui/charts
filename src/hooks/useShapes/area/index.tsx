import React from 'react';

import type {BaseType, Dispatch} from 'd3';
import {area as areaGenerator, color, line as lineGenerator, select} from 'd3';
import get from 'lodash/get';

import {block, filterOverlappingLabels} from '../../..//utils';
import type {LabelData, TooltipDataChunkArea} from '../../../types';
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

import type {MarkerData, PointData, PreparedAreaData} from './types';

const b = block('d3-area');

type Args = {
    dispatcher: Dispatch<object>;
    preparedData: PreparedAreaData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const AreaSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const hoveredDataRef = React.useRef<TooltipDataChunkArea[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = get(seriesOptions, 'area.states.hover');
        const inactiveOptions = get(seriesOptions, 'area.states.inactive');

        const line = lineGenerator<PointData>()
            .x((d) => d.x)
            .y((d) => d.y);

        svgElement.selectAll('*').remove();

        const shapeSelection = svgElement
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
            .x((d) => d.x)
            .y0((d) => d.y0)
            .y1((d) => d.y);
        shapeSelection
            .append('path')
            .attr('class', b('region'))
            .attr('d', (d) => area(d.points))
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.opacity);

        let dataLabels = preparedData.reduce((acc, d) => {
            return acc.concat(d.labels);
        }, [] as LabelData[]);

        if (!preparedData[0]?.series.dataLabels.allowOverlap) {
            dataLabels = filterOverlappingLabels(dataLabels);
        }

        const labelsSelection = svgElement
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
        const markerSelection = svgElement
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
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher.on('hover-shape.area', handleShapeHover);

        return () => {
            dispatcher.on('hover-shape.area', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
