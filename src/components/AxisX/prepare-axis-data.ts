import {getUniqId} from '@gravity-ui/uikit';
import type {AxisDomain, AxisScale} from 'd3-axis';
import {select} from 'd3-selection';

import {
    calculateCos,
    calculateSin,
    formatAxisTickLabel,
    getBandsPosition,
    getLabelsSize,
    getMinSpaceBetween,
    getTextSizeFn,
    getTextWithElipsis,
} from '~core/utils';
import {getXAxisTickValues} from '~core/utils/axis/x-axis';

import type {ChartScale, PreparedAxis, PreparedSeries, PreparedSplit} from '../../hooks';
import type {HtmlItem} from '../../types';
import type {TextRowData} from '../types';
import {getMultilineTitleContentRows} from '../utils/axis-title';

import type {
    AxisDomainData,
    AxisPlotBandData,
    AxisPlotLineData,
    AxisPlotLineLabel,
    AxisPlotShapeData,
    AxisSvgLabelData,
    AxisTickData,
    AxisTickLine,
    AxisTickMarkData,
    AxisTitleData,
    AxisXData,
} from './types';

async function getSvgAxisLabel({
    getTextSize,
    text,
    axis,
    top,
    left,
    labelMaxWidth,
    axisWidth,
    boundsOffsetLeft,
    boundsOffsetRight,
}: {
    getTextSize: (str: string) => Promise<{width: number; height: number; hangingOffset: number}>;
    text: string;
    axis: PreparedAxis;
    top: number;
    left: number;
    labelMaxWidth: number;
    axisWidth: number;
    boundsOffsetLeft: number;
    boundsOffsetRight: number;
}) {
    const rotation = axis.labels.rotation;
    const content: AxisSvgLabelData['content'] = [];

    let rowText = text;
    let textSize = await getTextSize(text);
    const a = (360 + rotation) % 90;

    let textMaxWidth = Infinity;
    if (a === 0) {
        textMaxWidth = Math.min(
            labelMaxWidth,
            // rightmost label
            labelMaxWidth / 2 + axisWidth + boundsOffsetRight - left,
        );
    } else if (rotation > 0) {
        textMaxWidth = Math.min(
            axis.labels.height / calculateSin(a) - textSize.height * calculateSin(90 - a),
            // rightmost label
            (axisWidth - left) / calculateSin(a),
        );
    } else {
        textMaxWidth = Math.min(
            axis.labels.height / calculateSin(a) - textSize.height * calculateSin(90 - a),
            // leftmostLabel
            (boundsOffsetLeft + left) / calculateSin(a),
        );
    }

    if (textSize.width > textMaxWidth) {
        rowText = await getTextWithElipsis({
            text: rowText,
            getTextWidth: async (str) => (await getTextSize(str)).width,
            maxWidth: textMaxWidth,
        });
        textSize = await getTextSize(rowText);
    }

    content.push({
        text: rowText,
        x: 0,
        y: 0,
        size: textSize,
    });

    const actualTextWidth = a
        ? textSize.width * calculateSin(90 - a) + textSize.height * calculateSin(a)
        : textSize.width;
    let x = 0;
    if (rotation === 0) {
        x = Math.min(left - actualTextWidth / 2, axisWidth - actualTextWidth);
    } else if (rotation < 0) {
        const xOffset = (textSize.width * calculateSin(90 - a)) / 2;
        x = left - actualTextWidth / 2 - xOffset;
        x = Math.min(x, axisWidth - actualTextWidth);
    } else {
        const xOffset = (textSize.width * calculateSin(90 - a)) / 2;
        x = left + actualTextWidth / 2 - xOffset;
    }
    const yOffset = rotation <= 0 ? textSize.width * calculateSin(a) : 0;
    const hOffset = textSize.hangingOffset;
    const y = top + yOffset + axis.labels.margin + hOffset * calculateCos(rotation);
    x -= hOffset * calculateSin(rotation);

    const svgLabel: AxisSvgLabelData = {
        title: content[0]?.text === text ? undefined : text,
        content,
        style: axis.labels.style,
        size: textSize,
        x: Math.max(-boundsOffsetLeft, x),
        y,
        angle: rotation,
    };

    return svgLabel;
}

export async function prepareXAxisData({
    axis,
    boundsOffsetLeft,
    boundsOffsetRight,
    boundsWidth,
    height,
    scale,
    series,
    split,
    yAxis,
}: {
    axis: PreparedAxis;
    boundsOffsetLeft: number;
    boundsOffsetRight: number;
    boundsWidth: number;
    height: number;
    scale: ChartScale;
    series: PreparedSeries[];
    split: PreparedSplit | undefined;
    yAxis: PreparedAxis[];
}): Promise<AxisXData[]> {
    const xAxisItems: AxisXData[] = [];
    const splitPlots = split?.plots ?? [];
    for (let plotIndex = 0; plotIndex < splitPlots.length; plotIndex++) {
        const plot = splitPlots[plotIndex];
        const axisTop = plot.top;
        const axisHeight = plot.height;
        const axisWidth = boundsWidth;
        const isBottomPlot = plotIndex === splitPlots.length - 1;

        const plotYAxes = yAxis.filter((a) => a.plotIndex === plotIndex);
        const yDomainLeftPosition = plotYAxes.find((a) => a.position === 'left')?.visible
            ? 0
            : null;
        const yDomainRightPosition = plotYAxes.find((a) => a.position === 'right')?.visible
            ? axisWidth
            : null;

        let domain: AxisDomainData | null = null;
        if (isBottomPlot && axis.visible) {
            domain = {
                start: [0, axisTop + axisHeight],
                end: [axisWidth, axisTop + axisHeight],
                lineColor: axis.lineColor ?? '',
            };
        }

        const ticks: AxisTickData[] = [];
        const getTextSize = getTextSizeFn({style: axis.labels.style});
        const labelLineHeight = (await getTextSize('Tmp')).height;

        let values = getXAxisTickValues({scale, axis, labelLineHeight, series});
        let tickStep = getMinSpaceBetween(values as {value: unknown}[], (d) => Number(d.value));

        if (
            axis.labels.enabled &&
            axis.labels.rotation === 0 &&
            !axis.labels.html &&
            axis.type === 'datetime' &&
            values.length > 1
        ) {
            let maxLabelWidth = 0;

            for (let i = 0; i < values.length; i++) {
                const label = formatAxisTickLabel({
                    value: values[i].value,
                    axis,
                    step: tickStep,
                });
                const size = await getTextSize(label);
                maxLabelWidth = Math.max(maxLabelWidth, size.width);
            }

            const currentSpacing = Math.abs(values[0].x - values[1].x) - axis.labels.padding * 2;

            if (maxLabelWidth > currentSpacing) {
                values = getXAxisTickValues({
                    scale,
                    axis,
                    labelLineHeight: maxLabelWidth,
                    series,
                });
                tickStep = getMinSpaceBetween(values as {value: unknown}[], (d) => Number(d.value));
            }
        }

        const labelMaxWidth =
            values.length > 1
                ? Math.abs(values[0].x - values[1].x) - axis.labels.padding * 2
                : axisWidth;

        for (let i = 0; i < values.length; i++) {
            const tickValue = values[i];

            let svgLabel: AxisSvgLabelData | null = null;
            let htmlLabel: HtmlItem | null = null;

            if (isBottomPlot && axis.labels.enabled) {
                if (axis.labels.html) {
                    const content = String(tickValue.value);
                    const labelSize = await getLabelsSize({
                        labels: [content],
                        html: true,
                        style: axis.labels.style,
                    });
                    const size = {width: labelSize.maxWidth, height: labelSize.maxHeight};

                    htmlLabel = {
                        content,
                        x: tickValue.x - size.width / 2,
                        y: height + axis.labels.margin,
                        size,
                        style: axis.labels.style,
                    };
                } else {
                    const text = formatAxisTickLabel({
                        value: tickValue.value,
                        axis,
                        step: tickStep,
                    });
                    svgLabel = await getSvgAxisLabel({
                        getTextSize,
                        text,
                        axis,
                        top: height,
                        left: tickValue.x,
                        labelMaxWidth,
                        axisWidth,
                        boundsOffsetLeft,
                        boundsOffsetRight,
                    });
                }
            }

            let tickLine: AxisTickLine | null = null;
            if (
                axis.grid.enabled &&
                tickValue.x !== yDomainLeftPosition &&
                tickValue.x !== yDomainRightPosition
            ) {
                tickLine = {
                    points: [
                        [tickValue.x, axisTop],
                        [tickValue.x, axisTop + axisHeight],
                    ],
                };
            }

            let mark: AxisTickMarkData | null = null;
            if (isBottomPlot && axis.tickMarks.enabled) {
                const axisBottom = axisTop + axisHeight;
                mark = {
                    points: [
                        [tickValue.x, axisBottom],
                        [tickValue.x, axisBottom + axis.tickMarks.length],
                    ],
                };
            }

            ticks.push({
                line: tickLine,
                mark,
                svgLabel,
                htmlLabel,
            });
        }

        let title: AxisTitleData | null = null;
        if (axis.title.text) {
            const getTitleTextSize = getTextSizeFn({style: axis.title.style});

            const titleContent: TextRowData[] = [];
            const titleMaxWidth = axisWidth;

            if (axis.title.maxRowCount > 1) {
                const rows = await getMultilineTitleContentRows({axis, titleMaxWidth});
                titleContent.push(...rows);
            } else {
                const text = await getTextWithElipsis({
                    text: axis.title.text,
                    maxWidth: titleMaxWidth,
                    getTextWidth: async (s) => (await getTitleTextSize(s)).width,
                });
                const titleSize = await getTitleTextSize(text);
                titleContent.push({
                    text,
                    x: 0,
                    y: titleSize.hangingOffset,
                    size: titleSize,
                });
            }

            const titleTextSize = titleContent.reduce(
                (acc, item) => {
                    acc.width = Math.max(acc.width, item.size.width);
                    acc.height += item.size.height;
                    return acc;
                },
                {width: 0, height: 0},
            );

            let x = 0;
            switch (axis.title.align) {
                case 'left': {
                    x = 0;
                    break;
                }
                case 'center': {
                    x = Math.max(axisWidth / 2 - titleTextSize.width / 2);
                    break;
                }
                case 'right': {
                    x = Math.max(0, axisWidth - titleTextSize.width);
                    break;
                }
            }

            title = {
                content: titleContent,
                style: axis.title.style,
                size: titleTextSize,
                x,
                y: height + axis.labels.margin + axis.labels.height + axis.title.margin,
                rotate: 0,
                offset: 0,
            };
        }

        const plotBands: AxisPlotBandData[] = [];
        for (let i = 0; i < axis.plotBands.length; i++) {
            const plotBand = axis.plotBands[i];
            const axisScale = scale as AxisScale<AxisDomain>;
            const {from, to} = getBandsPosition({
                band: plotBand,
                axisScale,
                axis: 'x',
            });
            const halfBandwidth = (axisScale.bandwidth?.() ?? 0) / 2;
            const startPos = halfBandwidth + Math.min(from, to);
            const endPos = Math.min(Math.abs(to - from), axisWidth - Math.min(from, to));
            const plotBandWidth = Math.min(endPos, axisWidth);

            if (plotBandWidth < 0) {
                continue;
            }

            const getPlotLabelSize = getTextSizeFn({style: plotBand.label.style});
            const labelSize = plotBand.label.text
                ? await getPlotLabelSize(plotBand.label.text)
                : null;

            plotBands.push({
                layerPlacement: plotBand.layerPlacement,
                x: Math.max(0, startPos),
                y: axisTop,
                width: plotBandWidth,
                height: axisHeight,
                color: plotBand.color,
                opacity: plotBand.opacity,
                label: plotBand.label.text
                    ? {
                          text: plotBand.label.text,
                          style: plotBand.label.style,
                          x: plotBand.label.padding + (labelSize?.hangingOffset ?? 0),
                          y: plotBand.label.padding + (labelSize?.width ?? 0),
                          rotate: -90,
                          qa: plotBand.label.qa,
                      }
                    : null,
            });
        }

        const plotLines: AxisPlotLineData[] = [];
        for (let i = 0; i < axis.plotLines.length; i++) {
            const plotLine = axis.plotLines[i];
            const axisScale = scale as AxisScale<AxisDomain>;
            const plotLineValue = Number(axisScale(plotLine.value));

            if (plotLineValue < 0 || plotLineValue > boundsWidth) {
                continue;
            }

            const points: [number, number][] = [
                [plotLineValue, 0],
                [plotLineValue, axisHeight],
            ];

            let label: AxisPlotLineLabel | null = null;
            if (plotLine.label.text) {
                const getTitleTextSize = getTextSizeFn({style: plotLine.label.style});
                const size = await getTitleTextSize(plotLine.label.text);
                label = {
                    text: plotLine.label.text,
                    style: plotLine.label.style,
                    x: plotLineValue - plotLine.label.padding - size.height + size.hangingOffset,
                    y: plotLine.label.padding + size.width,
                    rotate: -90,
                    qa: plotLine.label.qa,
                };
            }

            plotLines.push({
                layerPlacement: plotLine.layerPlacement,
                x: 0,
                y: axisTop,
                width: axisWidth,
                color: plotLine.color,
                opacity: plotLine.opacity,
                label,
                points,
                lineWidth: plotLine.width,
                dashStyle: plotLine.dashStyle,
            });
        }

        const plotShapes: AxisPlotShapeData[] = [];
        const measureContainer = axis.plotShapes.length
            ? select(document.body)
                  .append('svg')
                  .style('visibility', 'hidden')
                  .style('position', 'absolute')
                  .style('top', '-200vw')
            : null;

        for (let i = 0; i < axis.plotShapes.length; i++) {
            if (!measureContainer) {
                break;
            }

            const plotShape = axis.plotShapes[i];
            const axisScale = scale as AxisScale<AxisDomain>;
            const shapeX = Number(axisScale(plotShape.value));

            if (shapeX < 0 || shapeX > boundsWidth) {
                continue;
            }

            const markup = plotShape.renderer({
                x: shapeX,
                y: 0,
                plotHeight: axisHeight,
                plotWidth: axisWidth,
            });

            const wrapper = measureContainer!.append('g').html(markup);
            const bbox = (wrapper.node() as SVGGraphicsElement).getBBox();
            wrapper.remove();

            plotShapes.push({
                hitbox: {x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height},
                layerPlacement: plotShape.layerPlacement,
                opacity: plotShape.opacity,
                plotHeight: axisHeight,
                plotWidth: axisWidth,
                renderer: plotShape.renderer,
                x: shapeX,
                y: axisTop,
            });
        }

        measureContainer?.remove();

        xAxisItems.push({
            id: getUniqId(),
            gridEnabled: axis.grid.enabled,
            title,
            ticks,
            domain,
            plotBands,
            plotLines,
            plotShapes,
        });
    }

    return xAxisItems;
}
