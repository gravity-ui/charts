import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import get from 'lodash/get';

import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {getRectPath} from '../../shapes/utils';
import {getLineDashArray} from '../../utils';

import type {PreparedXRangeData} from './types';

const b = block('x-range');

export function renderXRange(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedXRangeData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();

    const segmentSelection = svgElement
        .selectAll(`path.${b('segment')}`)
        .data(preparedData)
        .join('path')
        .attr('d', (d) => {
            const borderRadius = Math.min(d.height / 2, d.width / 2, d.series.borderRadius);
            return getRectPath({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                borderRadius,
            }).toString();
        })
        .attr('class', b('segment'))
        .attr('fill', (d) => d.color)
        .attr('opacity', (d) => d.data.opacity ?? d.series.opacity)
        .attr('cursor', (d) => d.series.cursor);

    svgElement
        .selectAll(`path.${b('segment-border')}`)
        .data(preparedData.filter((d) => d.series.borderWidth > 0))
        .join('path')
        .attr('d', (d) => {
            const borderRadius = Math.min(d.height / 2, d.width / 2, d.series.borderRadius);
            return getRectPath({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                borderRadius,
            }).toString();
        })
        .attr('class', b('segment-border'))
        .attr('fill', 'none')
        .attr('stroke', (d) => d.series.borderColor)
        .attr('stroke-width', (d) => d.series.borderWidth)
        .attr('stroke-dasharray', (d) =>
            getLineDashArray(d.series.borderDashStyle, d.series.borderWidth),
        )
        .attr('opacity', (d) => d.data.opacity ?? d.series.opacity)
        .attr('pointer-events', 'none');

    const svgLabels = preparedData.flatMap((d) => d.svgLabels);
    svgElement
        .selectAll(`text.${b('label')}`)
        .data(svgLabels)
        .join('text')
        .attr('class', b('label'))
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('text-anchor', (d) => d.textAnchor)
        .attr('dominant-baseline', 'central')
        .attr('pointer-events', 'none')
        .style('font-size', (d) => d.style.fontSize)
        .style('font-weight', (d) => d.style.fontWeight || null)
        .style('fill', (d) => d.style.fontColor || null)
        .html((d) => d.text);

    const hoverOptions = get(seriesOptions, 'x-range.states.hover');
    const inactiveOptions = get(seriesOptions, 'x-range.states.inactive');

    function handleShapeHover(data?: PreparedXRangeData[]) {
        if (hoverOptions?.enabled) {
            const hoveredSet = new Set(data?.map((d) => d.data));
            segmentSelection.attr('fill', (d) => {
                const fillColor = d.color;
                if (hoveredSet.has(d.data)) {
                    return (
                        color(fillColor)?.brighter(hoverOptions.brightness).toString() || fillColor
                    );
                }
                return fillColor;
            });
        }

        if (inactiveOptions?.enabled) {
            const hoveredSeries = data?.map((d) => d.series.id);
            segmentSelection.attr('opacity', (d) => {
                if (hoveredSeries?.length && !hoveredSeries.includes(d.series.id)) {
                    return inactiveOptions.opacity || null;
                }
                return d.data.opacity ?? d.series.opacity ?? null;
            });
        }
    }

    dispatcher?.on('hover-shape.x-range', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.x-range', null);
    };
}
