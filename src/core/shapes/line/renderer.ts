import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import {line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkLine} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {getLineDashArray} from '../../utils';
import {renderAnnotations} from '../annotation';
import {renderDataLabels} from '../data-labels';
import {
    getMarkerHaloVisibility,
    getMarkerVisibility,
    renderMarker,
    selectMarkerHalo,
    selectMarkerSymbol,
    setMarker,
} from '../marker';
import {setActiveState} from '../utils';

import type {MarkerData, MarkerPointData, PointData, PreparedLineData} from './types';

const b = block('line');

export function renderLine(
    elements: {
        plot: SVGGElement;
        markers: SVGGElement;
        hoverMarkers: SVGGElement;
        annotations: SVGGElement;
        boundsWidth: number;
        boundsHeight: number;
    },
    preparedData: PreparedLineData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const plotSvgElement = select(elements.plot);
    const markersSvgElement = select(elements.markers);
    const hoverMarkersSvgElement = select(elements.hoverMarkers);
    const annotationsSvgElement = select(elements.annotations);
    const hoverOptions = get(seriesOptions, 'line.states.hover');
    const inactiveOptions = get(seriesOptions, 'line.states.inactive');

    const line = lineGenerator<PointData>()
        .defined((d) => d.y !== null && d.x !== null && !d.hiddenInLine)
        .x((d) => d.x as number)
        .y((d) => d.y as number);

    plotSvgElement.selectAll('*').remove();
    markersSvgElement.selectAll('*').remove();
    const lineSelection = plotSvgElement
        .selectAll('path')
        .data(preparedData)
        .join('path')
        .attr('d', (d) => line(d.points))
        .attr('fill', 'none')
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', (d) => d.lineWidth)
        .attr('stroke-linejoin', (d) => d.linejoin)
        .attr('stroke-linecap', (d) => d.linecap)
        .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.lineWidth))
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    const dataLabels = preparedData.reduce((acc, d) => {
        return acc.concat(d.svgLabels);
    }, [] as LabelData[]);

    const labelsSelection = renderDataLabels({
        container: plotSvgElement,
        data: dataLabels,
        className: b('label'),
    });

    const markers = preparedData.reduce<MarkerData[]>((acc, d) => acc.concat(d.markers), []);
    const markerSelection = markersSvgElement
        .selectAll('marker')
        .data(markers)
        .join('g')
        .call(renderMarker);

    renderAnnotations({
        anchors: preparedData.flatMap((d) => d.annotations),
        container: annotationsSvgElement,
        plotHeight: elements.boundsHeight,
        plotWidth: elements.boundsWidth,
    });

    const hoverEnabled = hoverOptions?.enabled;
    const inactiveEnabled = inactiveOptions?.enabled;

    function handleShapeHover(data?: TooltipDataChunkLine[]) {
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
                            color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                            initialColor
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
                selectMarkerSymbol(elementSelection).call(setMarker, hovered ? 'hover' : 'normal');
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

                if (series.marker.states.normal.enabled || !series.marker.states.hover.enabled) {
                    continue;
                }

                const point = seriesData.points.find((p) => p.data === chunk.data);

                if (!point || point.x === null || point.y === null) {
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

    const eventName = `hover-shape.line-${preparedData[0]?.id ?? 'unknown'}`;
    dispatcher?.on(eventName, handleShapeHover);

    return () => {
        dispatcher?.on(eventName, null);
    };
}
