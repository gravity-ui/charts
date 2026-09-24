import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import get from 'lodash/get';

import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {filterOverlappingLabels} from '../../utils';
import {renderDataLabels} from '../data-labels';

import type {PreparedBarXData} from './types';
import {getBarXPaths} from './utils';

const b = block('bar-x');

export function renderBarX(
    elements: {
        plot: SVGGElement;
        boundsWidth: number;
        boundsHeight: number;
    },
    preparedData: PreparedBarXData[],
    seriesOptions: PreparedSeriesOptions,
    allowOverlapDataLabels: boolean,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    const hoverOptions = get(seriesOptions, 'bar-x.states.hover');
    const inactiveOptions = get(seriesOptions, 'bar-x.states.inactive');
    svgElement.selectAll('*').remove();
    const paths = new Map(preparedData.map((d) => [d, getBarXPaths(d)]));
    const rectSelection = svgElement
        .selectAll('allRects')
        .data(preparedData)
        .join('path')
        .attr('d', (d) => paths.get(d)?.fill ?? '')
        .attr('class', b('segment'))
        .attr('fill', (d) => d.data.color || d.series.color)
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    const borderSelection = svgElement
        .selectAll(`path.${b('segment-border')}`)
        .data(preparedData.filter((d) => paths.get(d)?.border ?? ''))
        .join('path')
        .attr('d', (d) => paths.get(d)?.border ?? '')
        .attr('class', b('segment-border'))
        .attr('fill', (d) => d.borderColor)
        .attr('fill-rule', 'evenodd')
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    let dataLabels = preparedData.map((d) => d.svgLabels).flat();
    if (!allowOverlapDataLabels) {
        dataLabels = filterOverlappingLabels(dataLabels);
    }

    const labelSelection = renderDataLabels({
        container: svgElement,
        data: dataLabels,
        className: b('label'),
    });

    function handleShapeHover(data?: PreparedBarXData[]) {
        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        if (!data) {
            if (hoverEnabled) {
                rectSelection.attr('fill', (d) => d.data.color || d.series.color);
            }

            if (inactiveEnabled) {
                rectSelection.attr('opacity', (d) => d.opacity);
                borderSelection.attr('opacity', (d) => d.opacity);
                labelSelection.attr('opacity', null);
            }

            return;
        }

        if (hoverEnabled) {
            const hoveredValues = data.map((d) => d.data.x);
            rectSelection.attr('fill', (d) => {
                const fillColor = d.data.color || d.series.color;

                if (hoveredValues.includes(d.data.x)) {
                    return (
                        color(fillColor)?.brighter(hoverOptions?.brightness).toString() || fillColor
                    );
                }

                return fillColor;
            });
        }

        if (inactiveEnabled) {
            const hoveredSeries = data.map((d) => d.series.id);
            const getOpacity = (d: PreparedBarXData) =>
                hoveredSeries.includes(d.series.id) ? d.opacity : (inactiveOptions.opacity ?? null);
            rectSelection.attr('opacity', getOpacity);
            borderSelection.attr('opacity', getOpacity);
            labelSelection.attr('opacity', (d) => {
                return hoveredSeries.includes(d.series.id)
                    ? null
                    : inactiveOptions?.opacity || null;
            });
        }
    }

    dispatcher?.on('hover-shape.bar-x', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.bar-x', null);
    };
}
