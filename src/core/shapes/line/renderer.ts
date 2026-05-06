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
import {renderDataLabels} from '../data-labels';
import {setActiveState} from '../utils';

import type {PointData, PreparedLineData} from './types';

const b = block('line');

export function renderLine(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedLineData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const plotSvgElement = select(elements.plot);
    const hoverOptions = get(seriesOptions, 'line.states.hover');
    const inactiveOptions = get(seriesOptions, 'line.states.inactive');

    const line = lineGenerator<PointData>()
        .defined((d) => d.y !== null && d.x !== null && !d.hiddenInLine)
        .x((d) => d.x as number)
        .y((d) => d.y as number);

    plotSvgElement.selectAll('*').remove();
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

    const hoverEnabled = hoverOptions?.enabled;
    const inactiveEnabled = inactiveOptions?.enabled;

    function handleShapeHover(data?: TooltipDataChunkLine[]) {
        const selected = data?.filter((d) => d.series.type === 'line') || [];
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
    }

    const eventName = `hover-shape.line-${preparedData[0]?.id ?? 'unknown'}`;
    dispatcher?.on(eventName, handleShapeHover);

    return () => {
        dispatcher?.on(eventName, null);
    };
}
