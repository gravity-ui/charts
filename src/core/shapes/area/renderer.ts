import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import {area as areaGenerator, line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkArea} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {filterOverlappingLabels} from '../../utils';
import {ensureGradientDef, getBrighterGradient, getGradientBBox} from '../../utils/gradient';
import {renderDataLabels} from '../data-labels';
import {setActiveState} from '../utils';

import type {PointData, PreparedAreaData} from './types';

const b = block('area');

interface AreaGradientIds {
    fillHover?: string;
    fillNormal?: string;
    lineHover?: string;
    lineNormal?: string;
}

const gradientIds = new WeakMap<PreparedAreaData, AreaGradientIds>();

function computeAreaBBox(data: PreparedAreaData) {
    const bbox = getGradientBBox(data.points);
    if (!bbox) {
        return null;
    }
    for (const point of data.points) {
        if (point.y === null || point.hiddenInLine) {
            continue;
        }
        bbox.yMin = Math.min(bbox.yMin, point.y0);
        bbox.yMax = Math.max(bbox.yMax, point.y0);
    }
    return bbox;
}

function lineStrokeRef(
    data: PreparedAreaData,
    plot: SVGGElement,
    hovered = false,
    brightness?: number,
): string {
    const {gradient} = data.series;
    if (!gradient) {
        return data.color;
    }

    const bbox = getGradientBBox(data.points);
    if (!bbox) {
        return data.color;
    }

    const state = hovered ? 'lineHover' : 'lineNormal';
    const ids = gradientIds.get(data) ?? {};
    let id = ids[state];
    if (!id) {
        id = ensureGradientDef(
            plot,
            hovered ? getBrighterGradient(gradient, brightness) : gradient,
            bbox,
        );
        if (id) {
            ids[state] = id;
            gradientIds.set(data, ids);
        }
    }
    return id ? `url(#${id})` : data.color;
}

function areaFillRef(
    data: PreparedAreaData,
    plot: SVGGElement,
    hovered = false,
    brightness?: number,
): string {
    const {fillColor, fillGradient} = data.series;
    if (!fillGradient) {
        return fillColor;
    }

    const bbox = computeAreaBBox(data);
    if (!bbox) {
        return fillColor;
    }

    const state = hovered ? 'fillHover' : 'fillNormal';
    const ids = gradientIds.get(data) ?? {};
    let id = ids[state];
    if (!id) {
        id = ensureGradientDef(
            plot,
            hovered ? getBrighterGradient(fillGradient, brightness) : fillGradient,
            bbox,
        );
        if (id) {
            ids[state] = id;
            gradientIds.set(data, ids);
        }
    }
    return id ? `url(#${id})` : fillColor;
}

export function renderArea(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedAreaData[],
    seriesOptions: PreparedSeriesOptions,
    allowOverlapDataLabels: boolean,
    dispatcher?: Dispatch<object>,
): () => void {
    const plotSvgElement = select(elements.plot);
    const hoverOptions = get(seriesOptions, 'area.states.hover');
    const inactiveOptions = get(seriesOptions, 'area.states.inactive');

    const line = lineGenerator<PointData>()
        .x((d) => d.x)
        .defined((d) => d.y !== null && !d.hiddenInLine)
        .y((d) => d.y as number);

    plotSvgElement.selectAll('*').remove();
    preparedData.forEach((data) => gradientIds.delete(data));

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
        .attr('stroke', (d) => lineStrokeRef(d, elements.plot))
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
        .attr('fill', (d) => areaFillRef(d, elements.plot))
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

    const hoverEnabled = hoverOptions?.enabled;
    const inactiveEnabled = inactiveOptions?.enabled;

    function handleShapeHover(data?: TooltipDataChunkArea[]) {
        const selected = data?.filter((d) => d.series.type === 'area') || [];
        const selectedSeriesIds = selected.map((d) => d.series?.id);

        shapeSelection.datum((d, index, list) => {
            const elementSelection = select<BaseType, PreparedAreaData>(list[index]);

            const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
            if (d.hovered !== hovered) {
                d.hovered = hovered;

                const getHoveredColor = (initialColor: string) => {
                    return d.hovered
                        ? color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                              initialColor
                        : initialColor;
                };

                elementSelection
                    .selectAll(`.${b('line')}`)
                    .attr(
                        'stroke',
                        d.series.gradient
                            ? lineStrokeRef(d, elements.plot, d.hovered, hoverOptions?.brightness)
                            : getHoveredColor(d.color),
                    );
                elementSelection
                    .selectAll(`.${b('region')}`)
                    .attr(
                        'fill',
                        d.series.fillGradient
                            ? areaFillRef(d, elements.plot, d.hovered, hoverOptions?.brightness)
                            : getHoveredColor(d.series.fillColor),
                    );
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
    }

    dispatcher?.on('hover-shape.area', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.area', null);
    };
}
