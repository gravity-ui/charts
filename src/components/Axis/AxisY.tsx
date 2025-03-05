import React from 'react';

import {axisLeft, axisRight, line, select} from 'd3';
import type {Axis, AxisDomain, AxisScale, BaseType, Selection} from 'd3';

import type {ChartScale, PreparedAxis, PreparedAxisPlotLine, PreparedSplit} from '../../hooks';
import {
    block,
    calculateCos,
    calculateSin,
    formatAxisTickLabel,
    getAxisHeight,
    getAxisTitleRows,
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

const b = block('d3-axis');

type Props = {
    axes: PreparedAxis[];
    scale: ChartScale[];
    width: number;
    height: number;
    split: PreparedSplit;
    plotRef?: React.MutableRefObject<SVGGElement | null>;
};

function transformLabel(args: {node: Element; axis: PreparedAxis}) {
    const {node, axis} = args;
    let topOffset = axis.labels.lineHeight / 2;
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

    const x = -(
        axis.title.height -
        axis.title.height / rowCount +
        axis.title.margin +
        axis.labels.margin +
        axis.labels.width
    );
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

type PlotLineData = {
    transform: string;
} & PreparedAxisPlotLine;

export const AxisY = (props: Props) => {
    const {axes, width, height: totalHeight, scale, split, plotRef} = props;
    const height = getAxisHeight({split, boundsHeight: totalHeight});
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return;
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();

        const getAxisPosition = (axis: PreparedAxis) => {
            const top = split.plots[axis.plotIndex]?.top || 0;
            if (axis.position === 'left') {
                return `translate(0, ${top}px)`;
            }

            return `translate(${width}px, 0)`;
        };

        const plotLines = axes.reduce<PlotLineData[]>((acc, axis) => {
            if (axis.plotLines.length) {
                acc.push(
                    ...axis.plotLines.map((plotLine) => {
                        return {
                            ...plotLine,
                            transform: getAxisPosition(axis),
                        };
                    }),
                );
            }

            return acc;
        }, []);

        const axisSelection = svgElement
            .selectAll('axis')
            .data(axes)
            .join('g')
            .attr('class', b())
            .style('transform', (d) => getAxisPosition(d));

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

            if (d.labels.enabled) {
                const tickTexts = axisItem
                    .selectAll<SVGTextElement, string>('.tick text')
                    // The offset must be applied before the labels are rotated.
                    // Therefore, we reset the values and make an offset in transform  attribute.
                    // FIXME: give up axisLeft(d3) and switch to our own generation method
                    .attr('x', null)
                    .attr('dy', null)
                    .style('font-size', d.labels.style.fontSize)
                    .style('transform', function () {
                        return transformLabel({node: this, axis: d});
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

            if (plotRef && d.plotLines.length > 0) {
                const plotLineClassName = b('plotLine');
                const plotLineContainer = select(plotRef.current);
                plotLineContainer.selectAll(`.${plotLineClassName}`).remove();

                const plotLinesSelection = plotLineContainer
                    .selectAll(`.${plotLineClassName}`)
                    .data(plotLines)
                    .join('g')
                    .attr('class', plotLineClassName)
                    .style('transform', (plotLine) => plotLine.transform);

                plotLinesSelection
                    .append('path')
                    .attr('d', (plotLine) => {
                        const plotLineValue = Number(axisScale(plotLine.value));
                        const points: [number, number][] = [
                            [0, plotLineValue],
                            [width, plotLineValue],
                        ];

                        return line()(points);
                    })
                    .attr('stroke', (plotLine) => plotLine.color)
                    .attr('stroke-width', (plotLine) => plotLine.width)
                    .attr('stroke-dasharray', (plotLine) =>
                        getLineDashArray(plotLine.dashStyle, plotLine.width),
                    )
                    .attr('opacity', (plotLine) => plotLine.opacity);

                plotLinesSelection.each((plotLineData, i, nodes) => {
                    const plotLineSelection = select(nodes[i]);

                    if (plotLineData.layerPlacement === 'before') {
                        plotLineSelection.lower();
                    } else {
                        plotLineSelection.raise();
                    }
                });
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

                return line()(points);
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
            .attr('transform', (d) => {
                const titleRows = wrapText({
                    text: d.title.text,
                    style: d.title.style,
                    width: height,
                });
                const rowCount = Math.min(titleRows.length, d.title.maxRowCount);
                const {x, y} = getTitlePosition({axis: d, axisHeight: height, rowCount});
                const angle = d.position === 'left' ? -90 : 90;
                return `translate(${x}, ${y}) rotate(${angle})`;
            })
            .selectAll('tspan')
            .data((d) => getAxisTitleRows({axis: d, textMaxWidth: height}))
            .join('tspan')
            .attr('x', 0)
            .attr('y', (d) => d.y)
            .text((d) => d.text)
            .each((_d, index, nodes) => {
                if (index === nodes.length - 1) {
                    handleOverflowingText(nodes[index] as SVGTSpanElement, height);
                }
            });
    }, [axes, width, height, scale, split]);

    return <g ref={ref} className={b('container')} />;
};
