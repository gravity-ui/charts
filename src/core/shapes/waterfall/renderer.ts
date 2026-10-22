import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import {line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';
import {DASH_STYLE} from '../../constants';
import type {PreparedSeriesOptions} from '../../series/types';
import {filterOverlappingLabels, getLineDashArray, getWaterfallPointColor} from '../../utils';
import {renderDataLabels} from '../data-labels';

import type {PreparedWaterfallData} from './types';

const b = block('waterfall');

export function renderWaterfall(
    elements: {
        plot: SVGGElement;
        labelsPlot: SVGGElement;
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

    const labelSelection = renderDataLabels({
        container: select(elements.labelsPlot),
        data: dataLabels,
        className: b('label'),
    });

    // Add the connector line between bars
    const line = lineGenerator();
    const connectors = preparedData.flatMap((point, index) => {
        const previous = preparedData[index - 1];
        return previous && point.series.connectors.enabled ? [{from: previous, to: point}] : [];
    });
    svgElement
        .selectAll(connectorSelector)
        .data(connectors)
        .join('path')
        .attr('class', b('connector'))
        .attr('d', ({from, to}) => {
            const points: [number, number][] = [];
            const connectFromTop = from.data.total ? from.subTotal > 0 : Number(from.data.y) > 0;
            if (connectFromTop) {
                points.push([from.x, from.y]);
            } else {
                points.push([from.x, from.y + from.height]);
            }

            const connectToBottom = to.data.total ? to.subTotal < 0 : Number(to.data.y) > 0;
            if (connectToBottom) {
                points.push([to.x + to.width, to.y + to.height]);
            } else {
                points.push([to.x + to.width, to.y]);
            }

            return line(points);
        })
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', getLineDashArray(DASH_STYLE.Dash, 1));

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
