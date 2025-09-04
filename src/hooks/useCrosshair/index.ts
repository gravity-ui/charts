import React from 'react';

import {line, select} from 'd3';
import type {AxisDomain, AxisScale, Dispatch} from 'd3';

import type {ChartScale, PreparedAxis, PreparedSplit} from '../../hooks';
import type {CrosshairDataChunk} from '../../types';
import {block, getAxisPlotsPosition, getLineDashArray} from '../../utils';

import {useCrosshairHover} from './useCrosshairHover';

type Props = {
    xAxis: PreparedAxis;
    yAxes: PreparedAxis[];
    width: number;
    height: number;
    xScale?: ChartScale;
    yScale?: ChartScale[];
    split: PreparedSplit;
    plotRef?: React.MutableRefObject<SVGGElement | null>;
    dispatcher: Dispatch<object>;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
};

const b = block('crosshair');

export const useCrosshair = (props: Props) => {
    const {
        xScale,
        plotRef,
        yScale,
        dispatcher,
        xAxis,
        yAxes,
        split,
        width,
        height: totalHeight,
        boundsOffsetTop,
        boundsOffsetLeft,
    } = props;
    const crosshairEnabled =
        xAxis.crosshair.enabled || yAxes.some((axis) => axis.crosshair.enabled);

    const {hovered, pointerPosition} = useCrosshairHover({dispatcher, enabled: crosshairEnabled});
    const pointerXPos = pointerPosition?.[0] ?? 0;
    const pointerYPos = pointerPosition?.[1] ?? 0;

    React.useEffect(() => {
        if (!plotRef?.current || !xScale || !yScale?.length || !crosshairEnabled) {
            return;
        }
        const plotCrosshairClassName = b();

        const svgElement = select(plotRef.current);
        svgElement.selectAll(`.${plotCrosshairClassName}`).remove();

        const lineGenerator = line();

        if (xAxis.crosshair.enabled && hovered?.length) {
            const xAxisScale = xScale as AxisScale<AxisDomain>;
            const crosshairClassName = b('x-line');

            const crosshairSelection = svgElement
                .selectAll(`.${crosshairClassName}`)
                .data(hovered)
                .join('g')
                .attr('class', `${plotCrosshairClassName} ${crosshairClassName}`);

            crosshairSelection
                .append('path')
                .attr('d', (hoveredElement) => {
                    let lineValue;
                    if (xAxis.crosshair.snap) {
                        const offset = (xAxisScale.bandwidth?.() ?? 0) / 2;
                        lineValue = Number(xAxisScale(hoveredElement.data.x ?? 0)) + offset;
                    } else {
                        lineValue = pointerXPos - boundsOffsetLeft;
                    }

                    const points: [number, number][] = [
                        [lineValue, 0],
                        [lineValue, totalHeight],
                    ];

                    return lineGenerator(points);
                })
                .attr('stroke', xAxis.crosshair.color)
                .attr('stroke-width', xAxis.crosshair.width)
                .attr(
                    'stroke-dasharray',
                    getLineDashArray(xAxis.crosshair.dashStyle, xAxis.crosshair.width),
                )
                .attr('opacity', xAxis.crosshair.opacity);

            // set layer placement
            crosshairSelection.each((_, i, nodes) => {
                const crossSelection = select(nodes[i]);

                if (xAxis.crosshair.layerPlacement === 'before') {
                    crossSelection.lower();
                } else {
                    crossSelection.raise();
                }
            });
        }

        yAxes.forEach((yAxis, index, currentArr) => {
            const yAxisScale = yScale[index] as AxisScale<AxisDomain>;

            if (index !== 0 && !yAxis.crosshair.snap && !currentArr[0].crosshair.snap) {
                return;
            }

            if (yAxis.crosshair.enabled && hovered?.length) {
                const crosshairClassName = b(`y-line-${index}`);

                const crosshairSelection = svgElement
                    .selectAll(`.${crosshairClassName}`)
                    .data(
                        hovered.filter((node) => {
                            const n = node as CrosshairDataChunk & {series: {yAxis?: number}};
                            const yAxisIndex = n.series.yAxis ?? 0;
                            return yAxis.crosshair.snap
                                ? yAxisIndex === index && node.closest
                                : true;
                        }),
                    )
                    .join('g')
                    .attr('class', `${plotCrosshairClassName} ${crosshairClassName}`)
                    .style(
                        'transform',
                        yAxis.crosshair.snap
                            ? getAxisPlotsPosition(yAxis, split)
                            : 'translate(0, 0)',
                    );

                crosshairSelection
                    .append('path')
                    .attr('d', (hoveredElement) => {
                        let lineValue;
                        if (yAxis.crosshair.snap) {
                            const offset = (yAxisScale.bandwidth?.() ?? 0) / 2;
                            lineValue = Number(yAxisScale(hoveredElement.data.y ?? 0)) + offset;
                        } else {
                            lineValue = pointerYPos - boundsOffsetTop;
                        }
                        const points: [number, number][] = [
                            [0, lineValue],
                            [width, lineValue],
                        ];

                        return lineGenerator(points);
                    })
                    .attr('stroke', yAxis.crosshair.color)
                    .attr('stroke-width', yAxis.crosshair.width)
                    .attr(
                        'stroke-dasharray',
                        getLineDashArray(yAxis.crosshair.dashStyle, yAxis.crosshair.width),
                    )
                    .attr('opacity', yAxis.crosshair.opacity);

                crosshairSelection.each((_, i, nodes) => {
                    const plotLineSelection = select(nodes[i]);

                    if (yAxis.crosshair.layerPlacement === 'before') {
                        plotLineSelection.lower();
                    } else {
                        plotLineSelection.raise();
                    }
                });
            }
        });
    }, [
        hovered,
        crosshairEnabled,
        xAxis,
        yAxes,
        xScale,
        totalHeight,
        pointerXPos,
        boundsOffsetLeft,
        yScale,
        split,
        width,
        pointerYPos,
        boundsOffsetTop,
    ]);
};
