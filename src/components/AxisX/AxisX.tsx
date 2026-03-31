import React from 'react';

import {select} from 'd3-selection';
import type {Selection} from 'd3-selection';
import {line} from 'd3-shape';

import {getLineDashArray} from '~core/utils';

import {HtmlLayer} from '../../hooks/useShapes/HtmlLayer';
import type {HtmlItem} from '../../types';
import {block} from '../../utils';

import type {
    AxisPlotBandData,
    AxisPlotLineData,
    AxisPlotShapeData,
    AxisTickData,
    AxisXData,
} from './types';

import './styles.scss';

const b = block('x-axis');

interface Props {
    preparedAxisData: AxisXData;
    htmlLayout: HTMLElement | null;
    plotBeforeRef?: React.MutableRefObject<SVGGElement | null>;
    plotAfterRef?: React.MutableRefObject<SVGGElement | null>;
}

export const AxisX = (props: Props) => {
    const {htmlLayout, plotBeforeRef, plotAfterRef, preparedAxisData} = props;
    const ref = React.useRef<SVGGElement | null>(null);
    const lineGenerator = line();

    const htmlLabels = preparedAxisData.ticks.map((d) => d.htmlLabel).filter(Boolean) as HtmlItem[];

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();

        let plotBeforeContainer = null;
        let plotAfterContainer = null;
        const plotDataAttr = 'data-plot-x';
        const plotBandDataAttr = `data-plot-x-band-${preparedAxisData.id}`;
        const plotLineDataAttr = `data-plot-x-line-${preparedAxisData.id}`;
        const plotShapeDataAttr = `data-plot-x-shape-${preparedAxisData.id}`;

        if (plotBeforeRef?.current) {
            plotBeforeContainer = select(plotBeforeRef.current);
        }

        if (plotAfterRef?.current) {
            plotAfterContainer = select(plotAfterRef.current);
        }

        if (preparedAxisData.title) {
            svgElement
                .append('g')
                .attr('class', b('title'))
                .append('text')
                .attr('text-anchor', 'start')
                .attr(
                    'transform',
                    `translate(${preparedAxisData.title.x},${preparedAxisData.title.y}) rotate(${preparedAxisData.title.rotate}) translate(0,${preparedAxisData.title.offset})`,
                )
                .attr('font-size', preparedAxisData.title.style.fontSize)
                .attr('font-weight', preparedAxisData.title.style.fontWeight ?? null)
                .attr('fill', preparedAxisData.title.style.fontColor ?? null)
                .selectAll('tspan')
                .data(preparedAxisData.title.content)
                .join('tspan')
                .html((d) => d.text)
                .attr('x', (d) => d.x)
                .attr('y', (d) => d.y)
                .attr('dominant-baseline', 'hanging')
                .attr('text-anchor', 'start');
        }

        if (preparedAxisData.domain) {
            svgElement
                .append('path')
                .attr('class', b('domain'))
                .attr(
                    'd',
                    lineGenerator([preparedAxisData.domain.start, preparedAxisData.domain.end]),
                )
                .style('stroke', preparedAxisData.domain.lineColor);
        }

        const tickClassName = b('tick');
        const ticks = svgElement
            .selectAll(`.${tickClassName}`)
            .remove()
            .data(preparedAxisData.ticks)
            .join('g')
            .attr('class', tickClassName);

        const labelClassName = b('label');
        ticks.each(function () {
            const tickSelection = select(this);
            const tickData = tickSelection.datum() as AxisTickData;

            if (tickData.line) {
                tickSelection.append('path').attr('d', lineGenerator(tickData.line.points));
            }

            if (tickData.mark) {
                tickSelection
                    .append('path')
                    .attr('class', b('mark', {grid: preparedAxisData.gridEnabled}))
                    .attr('d', lineGenerator(tickData.mark.points));
            }

            if (tickData.svgLabel) {
                const label = tickData.svgLabel;
                const textSelection = tickSelection
                    .append('text')
                    .attr(
                        'transform',
                        [
                            `translate(${label.x}, ${label.y})`,
                            label.angle ? `rotate(${label.angle})` : '',
                        ]
                            .filter(Boolean)
                            .join(' '),
                    );

                if (label.title) {
                    textSelection.append('title').html(label.title);
                }

                textSelection
                    .selectAll('tspan')
                    .data(label.content)
                    .join('tspan')
                    .html((d) => d.text)
                    .attr('x', (d) => d.x)
                    .attr('y', (d) => d.y)
                    .attr('text-anchor', 'start')
                    .attr('class', labelClassName)
                    .style('dominant-baseline', 'hanging')
                    .style('font-size', label.style.fontSize)
                    .style('fill', label.style.fontColor ?? '');
            }
        });

        if (preparedAxisData.plotBands.length > 0) {
            const setPlotBands = (
                plotContainer: Selection<SVGGElement, unknown, null, undefined> | null,
                plotBands: AxisPlotBandData[],
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
                    .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

                plotBandsSelection
                    .append('rect')
                    .attr('width', (d) => d.width)
                    .attr('height', (d) => d.height)
                    .attr('fill', (d) => d.color)
                    .attr('opacity', (d) => d.opacity);

                plotBandsSelection.each(function () {
                    const plotBandSelection = select(this);
                    const band = plotBandSelection.datum() as AxisPlotBandData;
                    const label = band.label;

                    if (label) {
                        plotBandSelection
                            .append('text')
                            .html(label.text)
                            .style('fill', label.style.fontColor ?? '')
                            .style('font-size', label.style.fontSize)
                            .style('font-weight', label.style.fontWeight ?? '')
                            .style('dominant-baseline', 'hanging')
                            .style('text-anchor', 'start')
                            .attr(
                                'transform',
                                `translate(${label.x}, ${label.y}) rotate(${label.rotate})`,
                            )
                            .attr('data-qa', label.qa ?? null);
                    }
                });
            };

            setPlotBands(
                plotBeforeContainer,
                preparedAxisData.plotBands.filter((item) => item.layerPlacement === 'before'),
            );
            setPlotBands(
                plotAfterContainer,
                preparedAxisData.plotBands.filter((item) => item.layerPlacement === 'after'),
            );
        }

        if (preparedAxisData.plotLines.length > 0) {
            const setPlotLines = (
                plotContainer: Selection<SVGGElement, unknown, null, undefined> | null,
                plotLines: AxisPlotLineData[],
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
                    .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

                plotLinesSelection
                    .append('path')
                    .attr('d', (d) => lineGenerator(d.points))
                    .attr('stroke', (d) => d.color)
                    .attr('stroke-width', (d) => d.lineWidth)
                    .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.lineWidth))
                    .attr('opacity', (d) => d.opacity);

                plotLinesSelection.each(function () {
                    const itemSelection = select(this);
                    const plotLine = itemSelection.datum() as AxisPlotLineData;
                    const label = plotLine.label;

                    if (label) {
                        itemSelection
                            .append('text')
                            .text(label.text)
                            .style('fill', label.style.fontColor ?? '')
                            .style('font-size', label.style.fontSize)
                            .style('font-weight', label.style.fontWeight ?? '')
                            .style('dominant-baseline', 'hanging')
                            .style('text-anchor', 'start')
                            .attr(
                                'transform',
                                `translate(${label.x}, ${label.y}) rotate(${label.rotate})`,
                            )
                            .attr('data-qa', label.qa ?? null);
                    }
                });
            };

            setPlotLines(
                plotBeforeContainer,
                preparedAxisData.plotLines.filter((item) => item.layerPlacement === 'before'),
            );
            setPlotLines(
                plotAfterContainer,
                preparedAxisData.plotLines.filter((item) => item.layerPlacement === 'after'),
            );
        }
        if (preparedAxisData.plotShapes.length > 0) {
            const setPlotShapes = (
                plotContainer: Selection<SVGGElement, unknown, null, undefined> | null,
                plotShapes: AxisPlotShapeData[],
            ) => {
                if (!plotContainer || !plotShapes.length) {
                    return;
                }

                plotContainer
                    .selectAll(`[${plotShapeDataAttr}]`)
                    .remove()
                    .data(plotShapes)
                    .join('g')
                    .attr(plotDataAttr, 1)
                    .attr(plotShapeDataAttr, 1)
                    .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
                    .attr('opacity', (d) => d.opacity)
                    .html((d) =>
                        d.renderer({
                            x: d.x,
                            y: 0,
                            plotHeight: d.plotHeight,
                            plotWidth: d.plotWidth,
                        }),
                    );
            };

            setPlotShapes(
                plotBeforeContainer,
                preparedAxisData.plotShapes.filter((item) => item.layerPlacement === 'before'),
            );
            setPlotShapes(
                plotAfterContainer,
                preparedAxisData.plotShapes.filter((item) => item.layerPlacement === 'after'),
            );
        }

        return () => {
            if (plotBeforeContainer) {
                plotBeforeContainer.selectAll(`[${plotBandDataAttr}]`).remove();
                plotBeforeContainer.selectAll(`[${plotLineDataAttr}]`).remove();
                plotBeforeContainer.selectAll(`[${plotShapeDataAttr}]`).remove();
            }

            if (plotAfterContainer) {
                plotAfterContainer.selectAll(`[${plotBandDataAttr}]`).remove();
                plotAfterContainer.selectAll(`[${plotLineDataAttr}]`).remove();
                plotAfterContainer.selectAll(`[${plotShapeDataAttr}]`).remove();
            }
        };
    }, [lineGenerator, plotAfterRef, plotBeforeRef, preparedAxisData]);

    return (
        <React.Fragment>
            <HtmlLayer preparedData={{htmlElements: htmlLabels}} htmlLayout={htmlLayout} />
            <g ref={ref} className={b()} />
        </React.Fragment>
    );
};
