import React from 'react';

import {axisLeft, axisRight, line, select} from 'd3';
import type {Axis, AxisDomain, AxisScale, BaseType, Selection} from 'd3';

import type {ChartScale, PreparedAxis, PreparedAxisPlotLine, PreparedSplit} from '../../hooks';
import type {AxisPlotBand} from '../../types';
import {
    block,
    calculateCos,
    calculateSin,
    formatAxisTickLabel,
    getAxisHeight,
    getAxisPlotsPosition,
    getAxisTitleRows,
    getBandsPosition,
    getClosestPointsRange,
    getLineDashArray,
    getScaleTicks,
    getTicksCount,
    handleOverflowingText,
    parseTransformStyle,
    setEllipsisForOverflowTexts,
    wrapText,
} from '../../utils';

import './styles.scss';

const b = block('axis');

type Props = {
    axes: PreparedAxis[];
    scale: ChartScale[];
    width: number;
    height: number;
    split: PreparedSplit;
    plotBeforeRef?: React.MutableRefObject<SVGGElement | null>;
    plotAfterRef?: React.MutableRefObject<SVGGElement | null>;
    bottomLimit?: number;
    topLimit?: number;
};

function transformLabel(args: {node: Element; axis: PreparedAxis; startTopOffset?: number}) {
    const {node, axis, startTopOffset} = args;
    let topOffset = startTopOffset ?? axis.labels.lineHeight / 2;
    let leftOffset = axis.labels.margin;

    if (axis.position === 'left') {
        leftOffset = leftOffset * -1;
    }

    if (axis.labels.rotation) {
        if (axis.labels.rotation > 0) {
            leftOffset -= axis.labels.lineHeight * calculateSin(axis.labels.rotation);
            topOffset = axis.labels.lineHeight * calculateCos(axis.labels.rotation);

            if (axis.labels.rotation % 360 === 90) {
                topOffset = (node?.getBoundingClientRect().width || 0) / 2;
            }
        } else {
            topOffset = 0;

            if (axis.labels.rotation % 360 === -90) {
                topOffset = -(node?.getBoundingClientRect().width || 0) / 2;
            }
        }

        return `translate(${leftOffset}px, ${topOffset}px) rotate(${axis.labels.rotation}deg)`;
    }

    return `translate(${leftOffset}px, ${topOffset}px)`;
}

function getAxisGenerator(args: {
    preparedAxis: PreparedAxis;
    axisGenerator: Axis<AxisDomain>;
    width: number;
    height: number;
    scale: ChartScale;
}) {
    const {preparedAxis, axisGenerator: generator, width, height, scale} = args;
    const tickSize = preparedAxis.grid.enabled ? width * -1 : 0;
    const step = getClosestPointsRange(preparedAxis, getScaleTicks(scale as AxisScale<AxisDomain>));

    let axisGenerator = generator
        .tickSize(tickSize)
        .tickPadding(preparedAxis.labels.margin)
        .tickFormat((value) => {
            if (!preparedAxis.labels.enabled) {
                return '';
            }

            return formatAxisTickLabel({
                axis: preparedAxis,
                value,
                step,
            });
        });

    const ticksCount = getTicksCount({axis: preparedAxis, range: height});
    if (ticksCount) {
        axisGenerator = axisGenerator.ticks(ticksCount);
    }

    return axisGenerator;
}

function getTitlePosition(args: {axis: PreparedAxis; axisHeight: number; rowCount: number}) {
    const {axis, axisHeight, rowCount} = args;
    if (rowCount < 1) {
        return {x: 0, y: 0};
    }

    let x =
        axis.title.height -
        axis.title.height / rowCount +
        axis.title.margin +
        axis.labels.margin +
        axis.labels.width;

    if (axis.position === 'left') {
        x = x * -1;
    }

    let y;

    switch (axis.title.align) {
        case 'left': {
            y = axisHeight - axis.title.width / 2;
            break;
        }
        case 'right': {
            y = axis.title.width / 2;
            break;
        }
        case 'center': {
            y = axisHeight / 2;
            break;
        }
    }

    return {x, y};
}

export const AxisY = (props: Props) => {
    const {
        axes: allAxes,
        width,
        height: totalHeight,
        scale,
        split,
        plotBeforeRef,
        plotAfterRef,
        bottomLimit = 0,
        topLimit = 0,
    } = props;
    const height = getAxisHeight({split, boundsHeight: totalHeight});
    const ref = React.useRef<SVGGElement | null>(null);
    const lineGenerator = line();

    React.useEffect(() => {
        if (!ref.current) {
            return;
        }

        const axes = allAxes.filter((a) => a.visible);

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();

        let plotBeforeContainer = null;
        let plotAfterContainer = null;
        const plotDataAttr = 'data-plot-y';

        if (plotBeforeRef?.current) {
            plotBeforeContainer = select(plotBeforeRef.current);
            plotBeforeContainer.selectAll(`[${plotDataAttr}]`).remove();
        }

        if (plotAfterRef?.current) {
            plotAfterContainer = select(plotAfterRef.current);
            plotAfterContainer.selectAll(`[${plotDataAttr}]`).remove();
        }

        const axisSelection = svgElement
            .selectAll('axis')
            .data(axes)
            .join('g')
            .attr('class', b())
            .style('transform', (d) => getAxisPlotsPosition(d, split, width));

        axisSelection.each((d, index, node) => {
            const seriesScale = scale[index];
            const axisItem = select(node[index]) as Selection<
                SVGGElement,
                PreparedAxis,
                BaseType,
                unknown
            >;
            const axisScale = seriesScale as AxisScale<AxisDomain>;
            const yAxisGenerator = getAxisGenerator({
                axisGenerator: d.position === 'left' ? axisLeft(axisScale) : axisRight(axisScale),
                preparedAxis: d,
                height,
                width,
                scale: seriesScale,
            });
            yAxisGenerator(axisItem);

            // because the standard generator interrupts the desired font
            // https://github.com/d3/d3-axis/blob/main/src/axis.js#L110
            axisItem.attr('font-family', null);

            if (d.labels.enabled) {
                const labels = axisItem.selectAll<SVGTextElement, string>('.tick text');
                const tickTexts = labels
                    // The offset must be applied before the labels are rotated.
                    // Therefore, we reset the values and make an offset in transform  attribute.
                    // FIXME: give up axisLeft(d3) and switch to our own generation method
                    .attr('x', null)
                    .attr('dy', null)
                    .style('font-size', d.labels.style.fontSize)
                    .style('transform', function () {
                        return transformLabel({node: this, axis: d});
                    });

                labels.each(function (_d, i, nodes) {
                    const isFirstNode = i === 0;
                    const isLastNode = i === nodes.length - 1;

                    if (isFirstNode || isLastNode) {
                        const labelNode = this as SVGTextElement;
                        const labelNodeRect = labelNode.getBoundingClientRect();
                        const shouldBeTransformed =
                            (isFirstNode && labelNodeRect.bottom > bottomLimit) ||
                            (isLastNode && labelNodeRect.top < topLimit);

                        if (shouldBeTransformed) {
                            const text = select(labelNode);
                            const transform = transformLabel({
                                node: this,
                                axis: d,
                                startTopOffset: isLastNode ? labelNodeRect.height : 0,
                            });
                            text.style('transform', transform);
                            if (d.labels.rotation) {
                                text.attr('text-anchor', () => {
                                    return d.labels.rotation < 0 ? 'start' : 'end';
                                });
                            }
                        }
                    }
                });

                const textMaxWidth =
                    !d.labels.rotation || Math.abs(d.labels.rotation) % 360 !== 90
                        ? d.labels.maxWidth
                        : (height - d.labels.padding * (tickTexts.size() - 1)) / tickTexts.size();
                tickTexts.call(setEllipsisForOverflowTexts, textMaxWidth);
            }

            // remove overlapping ticks
            // Note: this method do not prepared for rotated labels
            if (!d.labels.rotation) {
                // HERE
                let elementY = 0;
                axisItem
                    .selectAll('.tick')
                    .filter(function (_d, tickIndex) {
                        const tickNode = this as unknown as Element;
                        const r = tickNode.getBoundingClientRect();
                        if (r.bottom > elementY && tickIndex !== 0) {
                            return true;
                        }
                        elementY = r.top - d.labels.padding;
                        return false;
                    })
                    .remove();
            }

            if (d.plotBands.length > 0) {
                const plotBandDataAttr = `data-plot-y-band-${index}`;

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
                        .attr(plotBandDataAttr, 1)
                        .style('transform', getAxisPlotsPosition(d, split));

                    plotBandsSelection
                        .append('rect')
                        .attr('x', 0)
                        .attr('width', width)
                        .attr('y', (band) => {
                            const {from, to} = getBandsPosition({band, axisScale, axis: 'y'});
                            const halfBandwidth = (axisScale.bandwidth?.() ?? 0) / 2;
                            const startPos = halfBandwidth + Math.min(from, to);

                            return Math.max(0, startPos);
                        })
                        .attr('height', (band) => {
                            const {from, to} = getBandsPosition({band, axisScale, axis: 'y'});
                            const startPos = height - Math.min(from, to);
                            const endPos = Math.min(Math.abs(to - from), startPos);

                            return Math.min(endPos, height);
                        })
                        .attr('fill', (band) => band.color)
                        .attr('opacity', (band) => band.opacity);
                };

                setPlotBands(
                    plotBeforeContainer,
                    d.plotBands.filter((item) => item.layerPlacement === 'before'),
                );
                setPlotBands(
                    plotAfterContainer,
                    d.plotBands.filter((item) => item.layerPlacement === 'after'),
                );
            }

            if (d.plotLines.length > 0) {
                const plotLineDataAttr = `data-plot-y-line-${index}`;

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
                        .attr(plotLineDataAttr, 1)
                        .style('transform', getAxisPlotsPosition(d, split));

                    plotLinesSelection
                        .append('path')
                        .attr('d', (plotLine) => {
                            const plotLineValue = Number(axisScale(plotLine.value));
                            const points: [number, number][] = [
                                [0, plotLineValue],
                                [width, plotLineValue],
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
                    d.plotLines.filter((item) => item.layerPlacement === 'before'),
                );
                setPlotLines(
                    plotAfterContainer,
                    d.plotLines.filter((item) => item.layerPlacement === 'after'),
                );
            }

            return axisItem;
        });

        axisSelection
            .select('.domain')
            .attr('d', () => {
                const points: [number, number][] = [
                    [0, 0],
                    [0, height],
                ];

                return lineGenerator(points);
            })
            .style('stroke', (d) => d.lineColor || '');

        svgElement.selectAll('.tick').each((_d, index, nodes) => {
            const tickNode = select(nodes[index]);
            if (parseTransformStyle(tickNode.attr('transform')).y === height) {
                // Remove stroke from tick that has the same y coordinate like domain
                tickNode.select('line').style('stroke', 'none');
            }
        });

        axisSelection
            .append('text')
            .attr('class', b('title'))
            .attr('text-anchor', 'middle')
            .attr('font-size', (d) => d.title.style.fontSize)
            .call(async (s) => {
                s.each(async function prepareAxisTitle(d) {
                    if (!this) {
                        return;
                    }
                    const selection = select(this);

                    const titleRows = await wrapText({
                        text: d.title.text,
                        style: d.title.style,
                        width: height,
                    });
                    const rowCount = Math.min(titleRows.length, d.title.maxRowCount);
                    const {x, y} = getTitlePosition({axis: d, axisHeight: height, rowCount});
                    const angle = d.position === 'left' ? -90 : 90;
                    selection.attr('transform', `translate(${x}, ${y}) rotate(${angle})`);

                    const axisTitleRows = await getAxisTitleRows({axis: d, textMaxWidth: height});

                    selection
                        .selectAll('tspan')
                        .data(axisTitleRows)
                        .join('tspan')
                        .attr('x', 0)
                        .attr('y', (titleRow) => titleRow.y)
                        .text((titleRow) => titleRow.text)
                        .each((_d, index, nodes) => {
                            if (index === nodes.length - 1) {
                                handleOverflowingText(nodes[index] as SVGTSpanElement, height);
                            }
                        });
                });

                return s;
            });
    }, [
        allAxes,
        width,
        height,
        scale,
        split,
        bottomLimit,
        lineGenerator,
        plotBeforeRef,
        plotAfterRef,
    ]);

    return <g ref={ref} className={b('container')} />;
};
