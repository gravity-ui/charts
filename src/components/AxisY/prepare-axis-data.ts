import {getUniqId} from '@gravity-ui/uikit';
import type {AxisDomain, AxisScale} from 'd3';

import type {ChartScale, PreparedAxis, PreparedSeries, PreparedSplit} from '../../hooks';
import type {HtmlItem} from '../../types';
import {
    calculateCos,
    calculateSin,
    formatAxisTickLabel,
    getBandsPosition,
    getLabelsSize,
    getMinSpaceBetween,
    getTextSizeFn,
    getTextWithElipsis,
    wrapText,
} from '../../utils';

import {prepareHtmlYAxisTitle, prepareSvgYAxisTitle} from './prepare-axis-title';
import type {
    AxisDomainData,
    AxisPlotBandData,
    AxisPlotLineData,
    AxisPlotLineLabel,
    AxisSvgLabelData,
    AxisTickData,
    AxisTickLine,
    AxisYData,
} from './types';
import {getTickValues} from './utils';

async function getSvgAxisLabel({
    getTextSize,
    text,
    axis,
    top,
    left,
    labelMaxHeight,
    topOffset,
}: {
    getTextSize: (str: string) => Promise<{width: number; height: number}>;
    text: string;
    axis: PreparedAxis;
    top: number;
    left: number;
    labelMaxHeight: number;
    topOffset: number;
}) {
    const originalTextSize = await getTextSize(text);
    // Currently, a preliminary label calculation is used to build the chart - we cannot exceed it here.
    // Therefore, we rely on a pre-calculated number instead of the current maximum label width.
    const labelMaxWidth = axis.labels.width; //axis.labels.maxWidth;

    const size = originalTextSize;
    const content: AxisSvgLabelData['content'] = [];
    // line breaks in the text are supported only
    // 1. for the category axis - it will look strange for numbers or dates
    // 2. for labels without rotation - it is unclear how to handle long strings correctly
    if (
        originalTextSize.width > labelMaxWidth &&
        axis.type === 'category' &&
        axis.labels.rotation === 0
    ) {
        const textRows = await wrapText({
            text,
            style: axis.labels.style,
            width: labelMaxWidth,
            getTextSize,
        });

        let labelTopOffset = 0;
        let newLabelWidth = 0;
        let newLabelHeight = 0;
        for (let textRowIndex = 0; textRowIndex < textRows.length; textRowIndex++) {
            const textRow = textRows[textRowIndex];
            let textSize = await getTextSize(textRow.text);

            if (newLabelHeight + textSize.height <= labelMaxHeight) {
                newLabelWidth = Math.max(newLabelWidth, textSize.width);
                newLabelHeight += textSize.height;

                let rowText = textRow.text.trim();

                if (textRowIndex < textRows.length - 1) {
                    const nextTextRow = textRows[textRowIndex + 1];
                    if (
                        newLabelHeight + (await getTextSize(nextTextRow.text)).height >
                        labelMaxHeight
                    ) {
                        rowText = textRow.text + nextTextRow.text;
                    }
                }

                textSize = await getTextSize(rowText);

                if (textSize.width > labelMaxWidth) {
                    rowText = await getTextWithElipsis({
                        text: rowText,
                        getTextWidth: async (str) => (await getTextSize(str)).width,
                        maxWidth: labelMaxWidth,
                    });
                    textSize = await getTextSize(rowText);
                }

                const x = axis.position === 'left' ? -textSize.width : 0;

                content.push({
                    text: rowText,
                    x,
                    y: labelTopOffset,
                    size: textSize,
                });
                labelTopOffset += textSize.height;
            }
        }

        content.forEach((row) => {
            row.y -= newLabelHeight / 2;
        });

        size.width = newLabelWidth;
        size.height = newLabelHeight;
    } else {
        let rowText = text;
        let textSize = await getTextSize(rowText);
        const textMaxWidth = Math.min(
            labelMaxWidth / calculateCos(axis.labels.rotation) -
                textSize.height * calculateCos(90 - axis.labels.rotation),
            // for vertical labels, we need to take into account the available height, otherwise there may be intersections
            axis.labels.rotation === 90 ? labelMaxHeight : Infinity,
            // if there is no rotation, then the height of the label does not affect the width of the text
            axis.labels.rotation === 0
                ? Infinity
                : (top + topOffset - textSize.height / 2) / calculateSin(axis.labels.rotation),
        );

        if (textSize.width > textMaxWidth) {
            rowText = await getTextWithElipsis({
                text: rowText,
                getTextWidth: async (str) => (await getTextSize(str)).width,
                maxWidth: textMaxWidth,
            });
            textSize = await getTextSize(rowText);
        }

        const actualTextHeight = axis.labels.rotation
            ? textSize.height / calculateSin(axis.labels.rotation)
            : textSize.height;
        const x = axis.position === 'left' ? -textSize.width : 0;
        const y = Math.max(-topOffset - top, -actualTextHeight / 2);
        content.push({
            text: rowText,
            x,
            y,
            size: textSize,
        });
    }

    const x = axis.position === 'left' ? left - axis.labels.margin : left + axis.labels.margin;
    const y = top;
    const svgLabel: AxisSvgLabelData = {
        title: content.length > 1 || content[0]?.text !== text ? text : undefined,
        content: content,
        style: axis.labels.style,
        size: size,
        x,
        y,
        angle: axis.labels.rotation,
    };

    return svgLabel;
}

export async function prepareYAxisData({
    axis,
    split,
    scale,
    top: topOffset,
    width,
    height,
    series,
}: {
    axis: PreparedAxis;
    split: PreparedSplit;
    scale: ChartScale;
    top: number;
    width: number;
    height: number;
    series: PreparedSeries[];
}): Promise<AxisYData> {
    const axisPlotTopPosition = split.plots[axis.plotIndex]?.top || 0;
    const axisHeight = split.plots[axis.plotIndex]?.height || height;

    const domainX = axis.position === 'left' ? 0 : width;
    let domain: AxisDomainData | null = null;
    if (axis.visible) {
        domain = {
            start: [domainX, axisPlotTopPosition],
            end: [domainX, axisPlotTopPosition + axisHeight],
            lineColor: axis.lineColor ?? '',
        };
    }

    const ticks: AxisTickData[] = [];
    const getTextSize = getTextSizeFn({style: axis.labels.style});
    const labelLineHeight = (await getTextSize('Tmp')).height;

    const values = getTickValues({scale, axis, labelLineHeight, series});
    const tickStep = getMinSpaceBetween(values as {value: unknown}[], (d) => Number(d.value));

    const labelMaxHeight =
        values.length > 1 ? values[0].y - values[1].y - axis.labels.padding * 2 : axisHeight;

    for (let i = 0; i < values.length; i++) {
        const tickValue = values[i];
        const y = axisPlotTopPosition + tickValue.y;

        let svgLabel: AxisSvgLabelData | null = null;
        let htmlLabel: HtmlItem | null = null;

        if (axis.labels.enabled) {
            if (axis.labels.html) {
                const content = String(tickValue.value);
                const labelSize = await getLabelsSize({
                    labels: [content],
                    html: true,
                    style: axis.labels.style,
                });
                const size = {width: labelSize.maxWidth, height: labelSize.maxHeight};
                const left = domainX;
                const top = y;

                const x =
                    axis.position === 'left'
                        ? left - size.width - axis.labels.margin
                        : left + axis.labels.margin;

                htmlLabel = {
                    content,
                    x,
                    y: top - size.height / 2,
                    size,
                    style: axis.labels.style,
                };
            } else {
                const text = formatAxisTickLabel({value: tickValue.value, axis, step: tickStep});
                svgLabel = await getSvgAxisLabel({
                    getTextSize,
                    text,
                    axis,
                    top: y,
                    left: domainX,
                    labelMaxHeight,
                    topOffset,
                });
            }
        }

        const tickLine: AxisTickLine | null = axis.grid.enabled
            ? {
                  points: [
                      [0, y],
                      [width, y],
                  ],
              }
            : null;

        ticks.push({
            line: tickLine,
            svgLabel,
            htmlLabel,
        });
    }

    let labelsWidth = ticks.reduce(
        (acc, item) => Math.max(acc, item.svgLabel?.size.width ?? item.htmlLabel?.size.width ?? 0),
        0,
    );
    labelsWidth = Math.min(axis.labels.width, labelsWidth);

    const title = axis.title.html
        ? await prepareHtmlYAxisTitle({
              axis,
              axisTop: axisPlotTopPosition,
              axisWidth: width,
              axisHeight,
              axisLabelsWidth: labelsWidth,
          })
        : await prepareSvgYAxisTitle({
              axis,
              axisTop: axisPlotTopPosition,
              axisWidth: width,
              axisHeight,
              axisLabelsWidth: labelsWidth,
          });

    const plotBands: AxisPlotBandData[] = [];
    axis.plotBands.forEach((plotBand) => {
        const axisScale = scale as AxisScale<AxisDomain>;
        const {from, to} = getBandsPosition({
            band: plotBand,
            axisScale,
            axis: 'y',
        });
        const halfBandwidth = (axisScale.bandwidth?.() ?? 0) / 2;
        const startPos = halfBandwidth + Math.min(from, to);
        const endPos = Math.min(Math.abs(to - from), axisHeight - Math.min(from, to));
        const top = Math.max(0, startPos);

        plotBands.push({
            layerPlacement: plotBand.layerPlacement,
            x: 0,
            y: axisPlotTopPosition + top,
            width,
            height: Math.min(endPos, axisHeight),
            color: plotBand.color,
            opacity: plotBand.opacity,
            label: plotBand.label.text
                ? {
                      text: plotBand.label.text,
                      style: plotBand.label.style,
                      x: plotBand.label.padding,
                      y: plotBand.label.padding,
                  }
                : null,
        });
    });

    const plotLines: AxisPlotLineData[] = [];
    for (let i = 0; i < axis.plotLines.length; i++) {
        const plotLine = axis.plotLines[i];
        const axisScale = scale as AxisScale<AxisDomain>;

        const plotLineValue = Number(axisScale(plotLine.value));
        const points: [number, number][] = [
            [0, plotLineValue],
            [width, plotLineValue],
        ];

        let label: AxisPlotLineLabel | null = null;
        if (plotLine.label.text) {
            const getTitleTextSize = getTextSizeFn({style: plotLine.label.style});
            const size = await getTitleTextSize(plotLine.label.text);
            label = {
                text: plotLine.label.text,
                style: plotLine.label.style,
                x: plotLine.label.padding,
                y: Math.max(0, plotLineValue - size.height - plotLine.label.padding),
            };
        }

        plotLines.push({
            layerPlacement: plotLine.layerPlacement,
            x: 0,
            y: axisPlotTopPosition,
            width,
            color: plotLine.color,
            opacity: plotLine.opacity,
            label,
            points,
            lineWidth: plotLine.width,
            dashStyle: plotLine.dashStyle,
        });
    }

    console.log({title});

    return {
        id: getUniqId(),
        title,
        ticks,
        domain,
        plotBands,
        plotLines,
    };
}
