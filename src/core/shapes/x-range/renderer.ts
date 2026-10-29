import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import {get} from 'es-toolkit/compat';

import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {getRectPath} from '../../shapes/utils';
import {getLineDashArray} from '../../utils';
import {renderDataLabels} from '../data-labels';

import type {PreparedXRangeData} from './types';
import {getXRangeBorderRadius} from './utils';

const b = block('x-range');

export function renderXRange(
    elements: {
        plot: SVGGElement;
        labelsPlot: SVGGElement;
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
            return getRectPath({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                borderRadius: getXRangeBorderRadius(d),
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
            return getRectPath({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                borderRadius: getXRangeBorderRadius(d),
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
    renderDataLabels({
        container: select(elements.labelsPlot),
        data: svgLabels,
        className: b('label'),
    })
        .attr('dominant-baseline', 'central')
        .attr('pointer-events', 'none');

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
