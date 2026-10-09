import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {renderDataLabels} from '../data-labels';

import type {BarYShapesArgs, PreparedBarYData} from './types';
import {getAdjustedRectBorderPath, getAdjustedRectPath} from './utils';

const b = block('bar-y');

export function renderBarY(
    elements: {
        plot: SVGGElement;
    },
    preparedData: BarYShapesArgs,
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const {shapes, labels: dataLabels} = preparedData;
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();
    const segmentSelection = svgElement
        .selectAll<SVGPathElement, PreparedBarYData>(`path.${b('segment')}`)
        .data(shapes)
        .join('path')
        .attr('d', (d) => getAdjustedRectPath(d))
        .attr('class', b('segment'))
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('height', (d) => d.height)
        .attr('width', (d) => d.width)
        .attr('fill', (d) => d.color)
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    const borderSelection = svgElement
        .selectAll<SVGPathElement, PreparedBarYData>(`path.${b('segment-border')}`)
        .data(shapes.filter((d) => d.borderWidth > 0))
        .join('path')
        .attr('d', (d) => getAdjustedRectBorderPath(d))
        .attr('class', b('segment-border'))
        .attr('fill', (d) => d.borderColor)
        .attr('fill-rule', 'evenodd')
        .attr('opacity', (d) => d.opacity)
        .attr('pointer-events', 'none');

    if (shapes.some((d) => d.series.grouping === false)) {
        // Keep each border next to its fill so later series cover both together.
        const borders = new Map<PreparedBarYData, SVGPathElement>();
        borderSelection.each(function (d) {
            borders.set(d, this);
        });
        segmentSelection.each(function (d) {
            const border = borders.get(d);
            if (border) this.after(border);
        });
    }

    const labelSelection = renderDataLabels({
        container: svgElement,
        data: dataLabels,
        className: b('label'),
    });

    const hoverOptions = get(seriesOptions, 'bar-y.states.hover');
    const inactiveOptions = get(seriesOptions, 'bar-y.states.inactive');

    function handleShapeHover(data?: PreparedBarYData[]) {
        if (hoverOptions?.enabled) {
            const hovered = data?.reduce((acc, d) => {
                acc.add(d.data.y);
                return acc;
            }, new Set());

            segmentSelection.attr('fill', (d) => {
                const fillColor = d.color;

                if (hovered?.has(d.data.y)) {
                    return (
                        color(fillColor)?.brighter(hoverOptions.brightness).toString() || fillColor
                    );
                }

                return fillColor;
            });
        }

        if (inactiveOptions?.enabled) {
            const hoveredSeries = data?.map((d) => d.series.id);
            const isInactive = (d: PreparedBarYData | LabelData) =>
                hoveredSeries?.length && !hoveredSeries.includes(d.series.id);
            const newOpacity = (d: PreparedBarYData) =>
                isInactive(d) ? d.opacity * (inactiveOptions.opacity ?? 1) : d.opacity;
            segmentSelection.attr('opacity', newOpacity);
            borderSelection.attr('opacity', newOpacity);
            labelSelection.attr('opacity', (d) => {
                if (isInactive(d)) {
                    return inactiveOptions.opacity ?? null;
                }

                return null;
            });
        }
    }

    dispatcher?.on('hover-shape.bar-y', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.bar-y', null);
    };
}
