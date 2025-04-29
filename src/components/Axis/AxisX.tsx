import React from 'react';

import {line, select} from 'd3';
import type {AxisDomain, AxisScale} from 'd3';

import type {ChartScale, PreparedAxis, PreparedSplit} from '../../hooks';
import {
    block,
    formatAxisTickLabel,
    getAxisTitleRows,
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
    plotRef?: React.MutableRefObject<SVGGElement | null>;
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
    const {axis, width, height: totalHeight, scale, split, plotRef} = props;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
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
        const xAxisGenerator = axisBottom({
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

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();

        svgElement.call(xAxisGenerator).attr('class', b());

        // add an axis header if necessary
        if (axis.title.text) {
            const titleRows = getAxisTitleRows({axis, textMaxWidth: width});
            svgElement
                .append('text')
                .attr('class', b('title'))
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

        // add plot lines
        if (plotRef && axis.plotLines.length > 0) {
            const plotLineClassName = b('plotLine');
            const plotLineContainer = select(plotRef.current);
            plotLineContainer.selectAll(`.${plotLineClassName}-x`).remove();

            const plotLinesSelection = plotLineContainer
                .selectAll(`.${plotLineClassName}-x`)
                .data(axis.plotLines)
                .join('g')
                .attr('class', `${plotLineClassName}-x`);

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

            // set layer placement
            plotLinesSelection.each((plotLineData, i, nodes) => {
                const plotLineSelection = select(nodes[i]);

                if (plotLineData.layerPlacement === 'before') {
                    plotLineSelection.lower();
                } else {
                    plotLineSelection.raise();
                }
            });
        }
    }, [axis, width, totalHeight, scale, split, plotRef]);

    return <g ref={ref} />;
});
