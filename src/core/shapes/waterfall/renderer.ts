import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import {line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import {DASH_STYLE} from '~core/constants';
import type {PreparedSeriesOptions} from '~core/series/types';
import {filterOverlappingLabels, getLineDashArray, getWaterfallPointColor} from '~core/utils';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';

import type {PreparedWaterfallData} from './types';

const b = block('waterfall');

export function renderWaterfall(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedWaterfallData[],
    seriesOptions: PreparedSeriesOptions,
    allowOverlapDataLabels: boolean,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    const connectorSelector = `.${b('connector')}`;
    const hoverOptions = get(seriesOptions, 'waterfall.states.hover');
    const inactiveOptions = get(seriesOptions, 'waterfall.states.inactive');
    svgElement.selectAll('*').remove();
    const rectSelection = svgElement
        .selectAll('allRects')
        .data(preparedData)
        .join('rect')
        .attr('class', b('segment'))
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('height', (d) => d.height)
        .attr('width', (d) => d.width)
        .attr('fill', (d) => getWaterfallPointColor(d.data, d.series))
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    let dataLabels = preparedData.map((d) => d.label).filter(Boolean) as LabelData[];
    if (!allowOverlapDataLabels) {
        dataLabels = filterOverlappingLabels(dataLabels);
    }

    const labelSelection = svgElement
        .selectAll('text')
        .data(dataLabels)
        .join('text')
        .html((d) => d.text)
        .attr('class', b('label'))
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('text-anchor', (d) => d.textAnchor)
        .style('font-size', (d) => d.style.fontSize)
        .style('font-weight', (d) => d.style.fontWeight || null)
        .style('fill', (d) => d.style.fontColor || null);

    // Add the connector line between bars
    svgElement
        .selectAll(connectorSelector)
        .data(preparedData)
        .join('path')
        .attr('class', b('connector'))
        .attr('d', (d, index) => {
            const line = lineGenerator();

            const prev = preparedData[index - 1];
            if (!prev) {
                return null;
            }

            const points: [number, number][] = [];
            if (Number(prev.data.y) > 0) {
                points.push([prev.x, prev.y]);
            } else {
                points.push([prev.x, prev.y + prev.height]);
            }

            if (Number(d.data.y) > 0 && !d.data.total) {
                points.push([d.x + d.width, d.y + d.height]);
            } else {
                points.push([d.x + d.width, d.y]);
            }

            return line(points);
        })
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', () => getLineDashArray(DASH_STYLE.Dash, 1));

    function handleShapeHover(data?: PreparedWaterfallData[]) {
        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        if (!data) {
            if (hoverEnabled) {
                rectSelection.attr('fill', (d) => getWaterfallPointColor(d.data, d.series));
            }

            if (inactiveEnabled) {
                rectSelection.attr('opacity', null);
                labelSelection.attr('opacity', null);
            }

            return;
        }

        if (hoverEnabled) {
            const hoveredValues = data.map((d) => d.data.x);
            rectSelection.attr('fill', (d) => {
                const fillColor = getWaterfallPointColor(d.data, d.series);

                if (hoveredValues.includes(d.data.x)) {
                    const brightness = hoverOptions?.brightness;
                    return color(fillColor)?.brighter(brightness).toString() || fillColor;
                }

                return fillColor;
            });
        }

        if (inactiveEnabled) {
            const hoveredSeries = data.map((d) => d.series.id);
            rectSelection.attr('opacity', (d) => {
                return hoveredSeries.includes(d.series.id)
                    ? null
                    : inactiveOptions?.opacity || null;
            });
            labelSelection.attr('opacity', (d) => {
                return hoveredSeries.includes(d.series.id)
                    ? null
                    : inactiveOptions?.opacity || null;
            });
        }
    }

    dispatcher?.on('hover-shape.waterfall', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.waterfall', null);
    };
}
