import {getUniqId} from '@gravity-ui/uikit';
import type {AxisDomain, AxisScale} from 'd3';

import type {ChartScale, PreparedAxis, PreparedSplit} from '../../hooks';
import type {HtmlItem} from '../../types';
import {
    calculateCos,
    calculateSin,
    getBandsPosition,
    getLabelFormatter,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
    wrapText,
} from '../../utils';

import type {
    AxisDomainData,
    AxisPlotBandData,
    AxisPlotLineData,
    AxisPlotLineLabel,
    AxisSvgLabelData,
    AxisTickData,
    AxisTickLine,
    AxisTitleData,
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
}: {
    getTextSize: (str: string) => Promise<{width: number; height: number}>;
    text: string;
    axis: PreparedAxis;
    top: number;
    left: number;
    labelMaxHeight: number;
}) {
    const originalTextSize = await getTextSize(text);
    // Currently, a preliminary label calculation is used to build the chart - we cannot exceed it here.
    // Therefore, we rely on a pre-calculated number instead of the current maximum label width.
    const labelMaxWidth = axis.labels.width; //axis.labels.maxWidth;

    const size = originalTextSize;
    const content: AxisSvgLabelData['content'] = [];
    // Warp label text only for categories - it will look strange for numbers or dates.
    if (originalTextSize.width > labelMaxWidth && axis.type === 'category') {
        const textRows = await wrapText({
            text,
            style: axis.labels.style,
            width: labelMaxWidth,
            getTextSize,
        });

        let topOffset = top;
        let newLabelWidth = 0;
        let newLabelHeight = 0;
        for (let textRowIndex = 0; textRowIndex < textRows.length; textRowIndex++) {
            const textRow = textRows[textRowIndex];
            let textSize = await getTextSize(textRow.text);

            if (newLabelHeight + textSize.height <= labelMaxHeight) {
                newLabelWidth = Math.max(newLabelWidth, textSize.width);
                newLabelHeight += textSize.height;

                let rowText = textRow.text;
                if (textSize.width > labelMaxWidth) {
                    rowText = await getTextWithElipsis({
                        text: rowText,
                        getTextWidth: async (str) => (await getTextSize(str)).width,
                        maxWidth: labelMaxWidth,
                    });
                    textSize = await getTextSize(rowText);
                }

                const x =
                    axis.position === 'left'
                        ? left - textSize.width - axis.labels.margin
                        : left + axis.labels.margin;

                content.push({
                    text: rowText,
                    x,
                    y: topOffset,
                });
                topOffset += textSize.height;
            }
        }

        content.forEach((row) => {
            row.y -= newLabelHeight / 2;
        });

        size.width = newLabelWidth;
        size.height = newLabelHeight;
    } else {
        const x =
            axis.position === 'left'
                ? left - size.width - axis.labels.margin
                : left + axis.labels.margin;
        content.push({
            text,
            x,
            y: Math.max(0, top - size.height / 2),
        });
    }

    const svgLabel: AxisSvgLabelData = {
        title: content.length > 1 || content[0]?.text !== text ? text : undefined,
        content: content,
        style: axis.labels.style,
        size: size,
    };

    return svgLabel;
}

export async function prepareAxisData({
    axis,
    split,
    scale,
    width,
    height,
}: {
    axis: PreparedAxis;
    split: PreparedSplit;
    scale: ChartScale;
    width: number;
    height: number;
}): Promise<AxisYData> {
    const domainX = axis.position === 'left' ? 0 : width;
    const domain: AxisDomainData = {
        start: [domainX, 0],
        end: [domainX, height],
        lineColor: axis.lineColor ?? '',
    };

    const ticks: AxisTickData[] = [];
    const getTextSize = getTextSizeFn({style: axis.labels.style});
    const labelLineHeight = (await getTextSize('Tmp')).height;

    const values = getTickValues({scale, axis, labelLineHeight});
    const labelMaxHeight =
        values.length > 1 ? values[0].y - values[1].y - axis.labels.padding * 2 : height;
    const labelFormatter = getLabelFormatter({axis, scale});

    for (let i = 0; i < values.length; i++) {
        const tickValue = values[i];
        const y = tickValue.y;

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
                const text = labelFormatter(tickValue.value);
                svgLabel = await getSvgAxisLabel({
                    getTextSize,
                    text,
                    axis,
                    top: y,
                    left: domainX,
                    labelMaxHeight,
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

    let title: AxisTitleData | null = null;
    if (axis.title.text) {
        const getTitleTextSize = getTextSizeFn({style: axis.title.style});
        const originalTextSize = await getTitleTextSize(axis.title.text);
        const rotateAngle = axis.position === 'left' ? -90 : 90;

        const sin = Math.abs(calculateSin(rotateAngle));
        const cos = Math.abs(calculateCos(rotateAngle));
        const rotatedTitleSize = {
            width: sin * originalTextSize.height + cos * originalTextSize.width,
            height: sin * originalTextSize.width + cos * originalTextSize.height,
        };

        const bottom = Math.max(0, calculateSin(rotateAngle) * originalTextSize.width);
        let y = 0;
        switch (axis.title.align) {
            case 'left': {
                y = -bottom + height;
                break;
            }
            case 'center': {
                y = -bottom + height / 2 + rotatedTitleSize.height / 2;
                break;
            }
            case 'right': {
                y = -bottom + rotatedTitleSize.height;
                break;
            }
        }

        const left = Math.min(0, calculateCos(rotateAngle) * originalTextSize.width);
        const x =
            axis.position === 'left'
                ? -left - labelsWidth - axis.labels.margin - axis.title.margin
                : -left + width + labelsWidth + axis.labels.margin + axis.title.margin;

        title = {
            content: axis.title.text,
            style: axis.title.style,
            size: rotatedTitleSize,
            x,
            y,
            rotate: rotateAngle,
        };
    }

    const axisPlotTopPosition = split.plots[axis.plotIndex]?.top || 0;

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
        const endPos = Math.min(Math.abs(to - from), height - Math.min(from, to));
        const top = Math.max(0, startPos);

        plotBands.push({
            layerPlacement: plotBand.layerPlacement,
            x: 0,
            y: axisPlotTopPosition + top,
            width,
            height: Math.min(endPos, height),
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

    return {
        id: getUniqId(),
        title,
        ticks,
        domain,
        plotBands,
        plotLines,
    };
}
