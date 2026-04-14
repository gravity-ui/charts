import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import get from 'lodash/get';

import {block} from '../../../utils';
import type {AnnotationAnchor, PreparedSeriesOptions} from '../../series/types';
import {filterOverlappingLabels} from '../../utils';
import {renderAnnotations} from '../annotation';
import {renderDataLabels} from '../data-labels';
import {getRectPath} from '../utils';

import type {PreparedBarXData} from './types';

const b = block('bar-x');

export function renderBarX(
    elements: {
        plot: SVGGElement;
        annotations: SVGGElement;
        boundsWidth: number;
        boundsHeight: number;
    },
    preparedData: PreparedBarXData[],
    seriesOptions: PreparedSeriesOptions,
    allowOverlapDataLabels: boolean,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    const annotationsSvgElement = select(elements.annotations);
    const hoverOptions = get(seriesOptions, 'bar-x.states.hover');
    const inactiveOptions = get(seriesOptions, 'bar-x.states.inactive');
    svgElement.selectAll('*').remove();
    const rectSelection = svgElement
        .selectAll('allRects')
        .data(preparedData)
        .join('path')
        .attr('d', (d) => {
            const borderRadius = d.isLastStackItem
                ? Math.min(d.height, d.width / 2, d.series.borderRadius)
                : 0;

            const p = getRectPath({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                borderRadius: [borderRadius, borderRadius, 0, 0],
            });

            return p.toString();
        })
        .attr('class', b('segment'))
        .attr('fill', (d) => d.data.color || d.series.color)
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

    const annotationAnchors: AnnotationAnchor[] = [];
    for (const d of preparedData) {
        if (d.annotation) {
            annotationAnchors.push({
                annotation: d.annotation,
                x: d.x + d.width / 2,
                y: d.y,
            });
        }
    }
    renderAnnotations({
        anchors: annotationAnchors,
        container: annotationsSvgElement,
        plotHeight: elements.boundsHeight,
        plotWidth: elements.boundsWidth,
    });

    function handleShapeHover(data?: PreparedBarXData[]) {
        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        if (!data) {
            if (hoverEnabled) {
                rectSelection.attr('fill', (d) => d.data.color || d.series.color);
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

    dispatcher?.on('hover-shape.bar-x', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.bar-x', null);
    };
}
