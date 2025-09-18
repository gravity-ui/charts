import React from 'react';

import {line, select} from 'd3';
import type {AxisDomain, AxisScale, Selection} from 'd3';

import type {ChartScale, PreparedAxis, PreparedAxisPlotLine, PreparedSplit} from '../../hooks';
import type {AxisPlotBand} from '../../types';
import {
    block,
    formatAxisTickLabel,
    getAxisTitleRows,
    getBandsPosition,
    getClosestPointsRange,
    getLineDashArray,
    getMaxTickCount,
    getScaleTicks,
    getTicksCount,
    handleOverflowingText,
} from '../../utils';
import {axisBottom} from '../../utils/chart/axis-generators';

import './styles.scss';

const b = block('axis');

type Props = {
    axis: PreparedAxis;
    width: number;
    height: number;
    scale: ChartScale;
    split: PreparedSplit;
    plotBeforeRef?: React.MutableRefObject<SVGGElement | null>;
    plotAfterRef?: React.MutableRefObject<SVGGElement | null>;
    leftmostLimit?: number;
};

function getLabelFormatter({axis, scale}: {axis: PreparedAxis; scale: ChartScale}) {
    const ticks = getScaleTicks(scale as AxisScale<AxisDomain>);
    const tickStep = getClosestPointsRange(axis, ticks);

    return (value: AxisDomain) => {
        if (!axis.labels.enabled) {
            return '';
        }

        return formatAxisTickLabel({
            axis,
            value,
            step: tickStep,
        });
    };
}

export function getTitlePosition(args: {axis: PreparedAxis; width: number; rowCount: number}) {
    const {axis, width, rowCount} = args;
    if (rowCount < 1) {
        return {x: 0, y: 0};
    }

    let x;
    const y =
        axis.title.height / rowCount + axis.title.margin + axis.labels.height + axis.labels.margin;

    switch (axis.title.align) {
        case 'left': {
            x = axis.title.width / 2;
            break;
        }
        case 'right': {
            x = width - axis.title.width / 2;
            break;
        }
        case 'center': {
            x = width / 2;
            break;
        }
    }

    return {x, y};
}

export const AxisX = React.memo(function AxisX(props: Props) {
    const {
        axis,
        width,
        height: totalHeight,
        scale,
        split,
        plotBeforeRef,
        plotAfterRef,
        leftmostLimit,
    } = props;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        (async () => {
            if (!ref.current) {
                return;
            }

            const svgElement = select(ref.current);
            svgElement.selectAll('*').remove();

            const plotDataAttr = 'data-plot-x';

            let plotBeforeContainer = null;
            let plotAfterContainer = null;

            if (plotBeforeRef?.current) {
                plotBeforeContainer = select(plotBeforeRef.current);
                plotBeforeContainer.selectAll(`[${plotDataAttr}]`).remove();
            }

            if (plotAfterRef?.current) {
                plotAfterContainer = select(plotAfterRef.current);
                plotAfterContainer.selectAll(`[${plotDataAttr}]`).remove();
            }

            if (!axis.visible) {
                return;
            }

            let tickItems: [number, number][] = [];
            if (axis.grid.enabled) {
                tickItems = new Array(split.plots.length || 1).fill(null).map((_, index) => {
                    const top = split.plots[index]?.top || 0;
                    const height = split.plots[index]?.height || totalHeight;

                    return [-top, -(top + height)];
                });
            }

            const axisScale = scale as AxisScale<AxisDomain>;
            const xAxisGenerator = await axisBottom({
                leftmostLimit,
                scale: axisScale,
                ticks: {
                    items: tickItems,
                    labelFormat: getLabelFormatter({axis, scale}),
                    labelsPaddings: axis.labels.padding,
                    labelsMargin: axis.labels.margin,
                    labelsStyle: axis.labels.style,
                    labelsMaxWidth: axis.labels.maxWidth,
                    labelsLineHeight: axis.labels.lineHeight,
                    count: getTicksCount({axis, range: width}),
                    maxTickCount: getMaxTickCount({axis, width}),
                    rotation: axis.labels.rotation,
                },
                domain: {
                    size: width,
                    color: axis.lineColor,
                },
            });

            svgElement.call(xAxisGenerator).attr('class', b());

            // add an axis header if necessary
            if (axis.title.text) {
                const titleRows = await getAxisTitleRows({axis, textMaxWidth: width});
                const titleClassName = b('title');
                svgElement.selectAll(`.${titleClassName}`).remove();
                svgElement
                    .append('text')
                    .attr('class', titleClassName)
                    .attr('transform', () => {
                        const {x, y} = getTitlePosition({axis, width, rowCount: titleRows.length});
                        return `translate(${x}, ${y})`;
                    })
                    .attr('font-size', axis.title.style.fontSize)
                    .attr('text-anchor', 'middle')
                    .selectAll('tspan')
                    .data(titleRows)
                    .join('tspan')
                    .attr('x', 0)
                    .attr('y', (d) => d.y)
                    .text((d) => d.text)
                    .each((_d, index, nodes) => {
                        if (index === axis.title.maxRowCount - 1) {
                            handleOverflowingText(nodes[index] as SVGTSpanElement, width);
                        }
                    });
            }

            // add plot bands
            if (axis.plotBands.length > 0) {
                const plotBandDataAttr = 'plot-x-band';
                const setPlotBands = (
                    plotContainer: Selection<SVGGElement, unknown, null, undefined> | null,
                    plotBands: Required<AxisPlotBand>[],
                ) => {
                    if (!plotContainer || !plotBands.length) {
                        return;
                    }

                    const plotBandsSelection = plotContainer
                        .selectAll(`[${plotBandDataAttr}]`)
                        .remove()
                        .data(plotBands)
                        .join('g')
                        .attr(plotDataAttr, 1)
                        .attr(plotBandDataAttr, 1);

                    plotBandsSelection
                        .append('rect')
                        .attr('x', (band) => {
                            const {from, to} = getBandsPosition({band, axisScale, axis: 'x'});
                            const halfBandwidth = (axisScale.bandwidth?.() ?? 0) / 2;
                            const startPos = halfBandwidth + Math.min(from, to);

                            return Math.max(0, startPos);
                        })
                        .attr('width', (band) => {
                            const {from, to} = getBandsPosition({band, axisScale, axis: 'x'});
                            const startPos = width - Math.min(from, to);
                            const endPos = Math.min(Math.abs(to - from), startPos);

                            return Math.min(endPos, width);
                        })
                        .attr('y', 0)
                        .attr('height', totalHeight)
                        .attr('fill', (band) => band.color)
                        .attr('opacity', (band) => band.opacity);
                };

                setPlotBands(
                    plotBeforeContainer,
                    axis.plotBands.filter((d) => d.layerPlacement === 'before'),
                );
                setPlotBands(
                    plotAfterContainer,
                    axis.plotBands.filter((d) => d.layerPlacement === 'after'),
                );
            }

            // add plot lines
            if (axis.plotLines.length > 0) {
                const plotLineDataAttr = 'plot-x-line';

                const setPlotLines = (
                    plotContainer: Selection<SVGGElement, unknown, null, undefined> | null,
                    plotLines: PreparedAxisPlotLine[],
                ) => {
                    if (!plotContainer || !plotLines.length) {
                        return;
                    }

                    const plotLinesSelection = plotContainer
                        .selectAll(`[${plotLineDataAttr}]`)
                        .remove()
                        .data(plotLines)
                        .join('g')
                        .attr(plotDataAttr, 1)
                        .attr(plotLineDataAttr, 1);

                    const lineGenerator = line();
                    plotLinesSelection
                        .append('path')
                        .attr('d', (plotLine) => {
                            const plotLineValue = Number(axisScale(plotLine.value));
                            const points: [number, number][] = [
                                [plotLineValue, 0],
                                [plotLineValue, totalHeight],
                            ];

                            return lineGenerator(points);
                        })
                        .attr('stroke', (plotLine) => plotLine.color)
                        .attr('stroke-width', (plotLine) => plotLine.width)
                        .attr('stroke-dasharray', (plotLine) =>
                            getLineDashArray(plotLine.dashStyle, plotLine.width),
                        )
                        .attr('opacity', (plotLine) => plotLine.opacity);
                };

                setPlotLines(
                    plotBeforeContainer,
                    axis.plotLines.filter((d) => d.layerPlacement === 'before'),
                );
                setPlotLines(
                    plotAfterContainer,
                    axis.plotLines.filter((d) => d.layerPlacement === 'after'),
                );
            }
        })();
    }, [axis, width, totalHeight, scale, split, leftmostLimit, plotBeforeRef, plotAfterRef]);

    return <g ref={ref} />;
});
