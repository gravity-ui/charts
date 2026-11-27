import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {HierarchyRectangularNode} from 'd3-hierarchy';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import get from 'es-toolkit/compat/get';

import type {PreparedSeriesOptions} from '~core/series/types';

import type {TooltipDataChunkTreemap, TreemapSeriesData} from '../../types';
import {block} from '../../utils';

import type {PreparedTreemapData, TreemapLabelData} from './types';

const b = block('treemap');

export function renderTreemap(
    elements: {
        plot: SVGGElement;
        labelsPlot: SVGGElement;
    },
    renderData: PreparedTreemapData,
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();
    const labelsSvgElement = select(elements.labelsPlot);
    labelsSvgElement.selectAll('*').remove();
    const {labelData, leaves, colors, series} = renderData;
    const leaf = svgElement
        .selectAll('g')
        .data(leaves)
        .join('g')
        .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
        .attr('cursor', series.cursor);
    const rectSelection = leaf
        .append('rect')
        .attr('id', (d) => d.id || d.name)
        .attr('opacity', (d) => d.data.opacity ?? null)
        .attr('fill', (d) => colors.get(d) ?? null)
        .attr('width', (d) => d.x1 - d.x0)
        .attr('height', (d) => d.y1 - d.y0);
    const labelSelection = labelsSvgElement
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
                .attr('fill', () => {
                    const initialColor = colors.get(d) ?? null;
                    if (hovered && initialColor) {
                        return (
                            color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                            initialColor
                        );
                    }
                    return initialColor;
                })
                .attr('opacity', () => {
                    if (inactive) {
                        return (d.data.opacity ?? 1) * (inactiveOptions?.opacity ?? 1);
                    }
                    return d.data.opacity ?? null;
                });

            return d;
        });
        labelSelection.datum((d, index, list) => {
            const currentLabel = select<BaseType, TreemapLabelData>(list[index]);
            const hovered = Boolean(hoverEnabled && hoveredData === d.nodeData);
            const inactive = Boolean(inactiveEnabled && hoveredData && !hovered);
            currentLabel.attr('opacity', () => {
                if (inactive) {
                    return inactiveOptions?.opacity ?? null;
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
