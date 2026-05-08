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
import {renderDataLabels} from '../data-labels';
import {setActiveState} from '../utils';

import type {PointData, PreparedAreaData} from './types';

const b = block('area');

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
    }

    dispatcher?.on('hover-shape.area', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.area', null);
    };
}
