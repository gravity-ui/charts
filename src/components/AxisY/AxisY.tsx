import React from 'react';

import {line, select} from 'd3';
import type {Selection} from 'd3';

import {HtmlLayer} from '../../hooks/useShapes/HtmlLayer';
import type {HtmlItem} from '../../types';
import {block, getLineDashArray} from '../../utils';

import type {AxisPlotBandData, AxisPlotLineData, AxisTickData, AxisYData} from './types';

import './styles.scss';

const b = block('y-axis');

interface Props {
    preparedAxisData: AxisYData;
    htmlLayout: HTMLElement | null;
    plotBeforeRef?: React.MutableRefObject<SVGGElement | null>;
    plotAfterRef?: React.MutableRefObject<SVGGElement | null>;
}

export const AxisY = (props: Props) => {
    const {htmlLayout, plotBeforeRef, plotAfterRef, preparedAxisData} = props;
    const ref = React.useRef<SVGGElement | null>(null);
    const lineGenerator = line();

    const htmlLabels = preparedAxisData.ticks.map((d) => d.htmlLabel).filter(Boolean) as HtmlItem[];

    React.useEffect(() => {
        if (!ref.current) {
            return;
        }

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

        if (preparedAxisData.title) {
            svgElement
                .append('g')
                .attr('class', b('title'))
                .append('text')
                .html(preparedAxisData.title.content)
                .attr('text-anchor', 'start')
                .style('dominant-baseline', 'text-after-edge')
                .style(
                    'transform',
                    `translate(${preparedAxisData.title.x}px, ${preparedAxisData.title.y}px) rotate(${preparedAxisData.title.rotate}deg)`,
                )
                .attr('font-size', preparedAxisData.title.style.fontSize);
        }

        svgElement
            .append('path')
            .attr('class', b('domain'))
            .attr('d', lineGenerator([preparedAxisData.domain.start, preparedAxisData.domain.end]))
            .style('stroke', preparedAxisData.domain.lineColor);

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

            if (tickData.svgLabel) {
                const label = tickData.svgLabel;
                const textSelection = tickSelection.append('text');

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
                    .style('dominant-baseline', 'text-before-edge')
                    .style('font-size', label.style.fontSize)
                    .style('fill', label.style.fontColor ?? '');
            }
        });

        if (preparedAxisData.plotBands.length > 0) {
            const plotBandDataAttr = `data-plot-y-band-${preparedAxisData.index}`;

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
                    .style('transform', (d) => `translate(${d.x}px, ${d.y}px)`);

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
                            .text(label.text)
                            .style('fill', label.style.fontColor ?? '')
                            .style('font-size', label.style.fontSize)
                            .style('font-weight', label.style.fontWeight ?? '')
                            .style('dominant-baseline', 'text-before-edge')
                            .attr('x', label.x)
                            .attr('y', label.y);
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
            const plotLineDataAttr = `data-plot-y-line-${preparedAxisData.index}`;

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
                    .style('transform', (d) => `translate(${d.x}px, ${d.y}px)`);

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
                            .style('dominant-baseline', 'text-before-edge')
                            .attr('x', label.x)
                            .attr('y', label.y);
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
    }, [lineGenerator, plotAfterRef, plotBeforeRef, preparedAxisData]);

    return (
        <React.Fragment>
            <HtmlLayer preparedData={{htmlElements: htmlLabels}} htmlLayout={htmlLayout} />
            <g transform={`translate(${preparedAxisData.left}, 0)`} ref={ref} className={b()} />
        </React.Fragment>
    );
};
