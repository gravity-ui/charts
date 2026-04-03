import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {HierarchyRectangularNode} from 'd3-hierarchy';
import {select} from 'd3-selection';
import type {BaseType} from 'd3-selection';
import get from 'lodash/get';

import type {TooltipDataChunkTreemap, TreemapSeriesData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';

import type {PreparedTreemapData, TreemapLabelData} from './types';

const b = block('treemap');

export function renderTreemap(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedTreemapData,
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();
    const {labelData, leaves, series} = preparedData;
    const leaf = svgElement
        .selectAll('g')
        .data(leaves)
        .join('g')
        .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
        .attr('cursor', series.cursor);
    const rectSelection = leaf
        .append('rect')
        .attr('id', (d) => d.id || d.name)
        .attr('fill', (d) => {
            if (d.data.color) {
                return d.data.color;
            }

            const levelOptions = series.levels?.find((l) => l.index === d.depth);
            return levelOptions?.color || series.color;
        })
        .attr('width', (d) => d.x1 - d.x0)
        .attr('height', (d) => d.y1 - d.y0);
    const labelSelection = svgElement
        .selectAll<SVGTextElement, typeof labelData>('tspan')
        .data(labelData)
        .join('text')
        .html((d) => d.text)
        .attr('class', b('label'))
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .style('font-size', () => series.dataLabels.style.fontSize)
        .style('font-weight', () => series.dataLabels.style?.fontWeight || null)
        .style('fill', () => series.dataLabels.style?.fontColor || null);

    const eventName = `hover-shape.treemap`;
    const hoverOptions = get(seriesOptions, 'treemap.states.hover');
    const inactiveOptions = get(seriesOptions, 'treemap.states.inactive');

    function handleShapeHover(data?: TooltipDataChunkTreemap[]) {
        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;
        const hoveredData = data?.[0]?.data;
        rectSelection.datum((d, index, list) => {
            const currentRect = select<BaseType, HierarchyRectangularNode<TreemapSeriesData>>(
                list[index],
            );
            const hovered = Boolean(hoverEnabled && hoveredData === d.data);
            const inactive = Boolean(inactiveEnabled && hoveredData && !hovered);
            currentRect
                .attr('fill', (currentD) => {
                    const levelOptions = series.levels?.find((l) => l.index === currentD.depth);
                    const initialColor = levelOptions?.color || d.data.color || series.color;
                    if (hovered) {
                        return (
                            color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                            initialColor
                        );
                    }
                    return initialColor;
                })
                .attr('opacity', () => {
                    if (inactive) {
                        return inactiveOptions?.opacity || null;
                    }
                    return null;
                });

            return d;
        });
        labelSelection.datum((d, index, list) => {
            const currentLabel = select<BaseType, TreemapLabelData>(list[index]);
            const hovered = Boolean(hoverEnabled && hoveredData === d.nodeData);
            const inactive = Boolean(inactiveEnabled && hoveredData && !hovered);
            currentLabel.attr('opacity', () => {
                if (inactive) {
                    return inactiveOptions?.opacity || null;
                }
                return null;
            });
            return d;
        });
    }

    dispatcher?.on(eventName, handleShapeHover);

    return () => {
        dispatcher?.on(eventName, null);
    };
}
