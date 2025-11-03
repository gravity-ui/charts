import React from 'react';

import {color, select} from 'd3';
import type {BaseType, Dispatch, HierarchyRectangularNode} from 'd3';
import get from 'lodash/get';

import type {TooltipDataChunkTreemap, TreemapSeriesData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedTreemapData, TreemapLabelData} from './types';

const b = block('treemap');

type ShapeProps = {
    preparedData: PreparedTreemapData;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
    dispatcher?: Dispatch<object>;
};

export const TreemapSeriesShape = (props: ShapeProps) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const hoveredDataRef = React.useRef<TooltipDataChunkTreemap[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
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
            hoveredDataRef.current = data;
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
                                color(initialColor)
                                    ?.brighter(hoverOptions?.brightness)
                                    .toString() || initialColor
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

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on(eventName, handleShapeHover);

        return () => {
            dispatcher?.on(eventName, null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
