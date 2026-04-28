import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import {area as areaGenerator, line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkArea} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedSeriesOptions} from '../../../series/types';
import {filterOverlappingLabels} from '../../../utils';
import {renderAnnotations} from '../shared/annotation';
import {renderDataLabels} from '../shared/data-labels';
import {
    getMarkerHaloVisibility,
    getMarkerVisibility,
    renderMarker,
    selectMarkerHalo,
    selectMarkerSymbol,
    setMarker,
} from '../shared/marker';
import {setActiveState} from '../shared/utils';

import type {MarkerData, MarkerPointData, PointData, PreparedAreaData} from './types';

const b = block('area');

export function renderArea(
    elements: {
        plot: SVGGElement;
        markers: SVGGElement;
        hoverMarkers: SVGGElement;
        annotations: SVGGElement;
        boundsWidth: number;
        boundsHeight: number;
    },
    preparedData: PreparedAreaData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const allowOverlapDataLabels = preparedData.some((d) => d.series.dataLabels.allowOverlap);
    const plotSvgElement = select(elements.plot);
    const markersSvgElement = select(elements.markers);
    const hoverMarkersSvgElement = select(elements.hoverMarkers);
    const annotationsSvgElement = select(elements.annotations);
    const hoverOptions = get(seriesOptions, 'area.states.hover');
    const inactiveOptions = get(seriesOptions, 'area.states.inactive');

    const line = lineGenerator<PointData>()
        .x((d) => d.x)
        .defined((d) => d.y !== null && !d.hiddenInLine)
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
        .defined((d) => d.y !== null && !d.hiddenInLine)
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
        return acc.concat(d.svgLabels);
    }, [] as LabelData[]);

    if (!allowOverlapDataLabels) {
        dataLabels = filterOverlappingLabels(dataLabels);
    }

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

    function handleShapeHover(data?: TooltipDataChunkArea[]) {
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

    dispatcher?.on('hover-shape.area', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.area', null);
    };
}
