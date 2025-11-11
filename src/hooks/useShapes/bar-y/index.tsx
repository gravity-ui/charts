import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {getRectBorderPath, getRectPath} from '../utils';

import type {BarYShapesArgs, PreparedBarYData} from './types';
export {prepareBarYData} from './prepare-data';

const b = block('bar-y');

type Args = {
    dispatcher: Dispatch<object>;
    preparedData: BarYShapesArgs;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
    clipPathId: string;
};

export const BarYSeriesShapes = (args: Args) => {
    const {
        dispatcher,
        preparedData: {shapes: preparedData, labels: dataLabels, htmlElements},
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const hoveredDataRef = React.useRef<PreparedBarYData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();
        const segmentSelection = svgElement
            .selectAll(`path.${b('segment')}`)
            .data(preparedData)
            .join('path')
            .attr('d', (d) => {
                const borderRadius = d.isLastStackItem
                    ? Math.min(d.height, d.width / 2, d.series.borderRadius)
                    : 0;

                // Fill should match the inner border dimensions to prevent color bleeding
                const halfBorder = d.borderWidth / 2;
                const innerBorderRadius = Math.max(borderRadius - halfBorder, 0);

                // Adjust fill position and size based on which borders are skipped
                let fillX = d.x;
                let fillY = d.y;
                let fillWidth = d.width;
                let fillHeight = d.height;
                let fillBorderRadiusRight = borderRadius;

                if (d.borderWidth > 0) {
                    // Default: fill is inset by halfBorder on all sides
                    fillX = d.x + halfBorder;
                    fillY = d.y + halfBorder;
                    fillWidth = d.width - d.borderWidth;
                    fillHeight = d.height - d.borderWidth;
                    fillBorderRadiusRight = innerBorderRadius;

                    if (d.skipBorderStart && d.skipBorderEnd) {
                        // No border on either side - fill extends fully horizontally
                        fillX = d.x;
                        fillWidth = d.width;
                    } else if (d.skipBorderStart) {
                        // No left border - fill extends to the left edge
                        // Since position was shifted left by halfBorder in prepare-data,
                        // fill should extend from x to x + width (full width, no left inset, right inset is included in position)
                        fillX = d.x;
                        fillWidth = d.width;
                        fillBorderRadiusRight = 0;
                    } else if (d.skipBorderEnd) {
                        // No right border - fill extends to the right edge
                        // Position was shifted right by halfBorder, fill extends full width from that point
                        fillWidth = d.width;
                        fillBorderRadiusRight = 0;
                    }
                }

                const p = getRectPath({
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight,
                    borderRadius: [0, fillBorderRadiusRight, fillBorderRadiusRight, 0],
                });

                return p.toString();
            })
            .attr('class', b('segment'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height)
            .attr('width', (d) => d.width)
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.data.opacity || null)
            .attr('cursor', (d) => d.series.cursor);

        const borderSelection = svgElement
            .selectAll(`path.${b('segment-border')}`)
            .data(preparedData.filter((d) => d.borderWidth > 0))
            .join('path')
            .attr('d', (d) => {
                const borderRadius = d.isLastStackItem
                    ? Math.min(d.height, d.width / 2, d.series.borderRadius)
                    : 0;

                return getRectBorderPath({
                    x: d.x,
                    y: d.y,
                    width: d.width,
                    height: d.height,
                    borderWidth: d.borderWidth,
                    borderRadius: [0, borderRadius, borderRadius, 0],
                    skipBorderStart: d.skipBorderStart,
                    skipBorderEnd: d.skipBorderEnd,
                });
            })
            .attr('class', b('segment-border'))
            .attr('fill', (d) => d.borderColor)
            .attr('fill-rule', 'evenodd')
            .attr('opacity', (d) => d.data.opacity || null)
            .attr('pointer-events', 'none');

        const labelSelection = svgElement
            .selectAll('text')
            .data(dataLabels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        const hoverOptions = get(seriesOptions, 'bar-y.states.hover');
        const inactiveOptions = get(seriesOptions, 'bar-y.states.inactive');

        function handleShapeHover(data?: PreparedBarYData[]) {
            hoveredDataRef.current = data;

            if (hoverOptions?.enabled) {
                const hovered = data?.reduce((acc, d) => {
                    acc.add(d.data.y);
                    return acc;
                }, new Set());

                segmentSelection.attr('fill', (d) => {
                    const fillColor = d.color;

                    if (hovered?.has(d.data.y)) {
                        return (
                            color(fillColor)?.brighter(hoverOptions.brightness).toString() ||
                            fillColor
                        );
                    }

                    return fillColor;
                });
            }

            if (inactiveOptions?.enabled) {
                const hoveredSeries = data?.map((d) => d.series.id);
                const newOpacity = (d: PreparedBarYData | LabelData) => {
                    if (hoveredSeries?.length && !hoveredSeries.includes(d.series.id)) {
                        return inactiveOptions.opacity || null;
                    }

                    return null;
                };
                segmentSelection.attr('opacity', newOpacity);
                borderSelection.attr('opacity', newOpacity);
                labelSelection.attr('opacity', newOpacity);
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher.on('hover-shape.bar-y', handleShapeHover);

        return () => {
            dispatcher.on('hover-shape.bar-y', null);
        };
    }, [dataLabels, dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
