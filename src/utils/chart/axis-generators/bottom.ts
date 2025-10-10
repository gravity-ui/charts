import type {AxisDomain, AxisScale, BaseType, Selection} from 'd3';
import {path, select} from 'd3';

import type {BaseTextStyle, DeepRequired, MeaningfulAny} from '../../../types';
import {getXAxisItems, getXAxisOffset, getXTickPosition} from '../axis';
import {calculateCos, calculateSin} from '../math';
import {getLabelsSize, setEllipsisForOverflowText} from '../text';

const HTML_LABELS_DATA_ATTR = 'data-labels-axis-x';

interface AxisBottomArgs {
    htmlLayout: HTMLElement;
    scale: AxisScale<AxisDomain>;
    ticks: {
        count?: number;
        items?: [number, number][];
        labelFormat?: (value: MeaningfulAny) => string;
        labelsHtml?: boolean;
        labelsLineHeight: number;
        labelsMargin?: number;
        labelsMaxWidth?: number;
        labelsPaddings?: number;
        labelsStyle?: BaseTextStyle;
        maxTickCount?: number;
        rotation?: number;
        tickColor?: string;
    };
    domain: {
        size: number;
        color?: string;
    };
    boundsOffsetLeft?: number;
    html?: boolean;
    leftmostLimit?: number;
}

interface HtmlLabelData {
    content: string;
    left: number;
    top: number;
}

function addDomain(
    selection: Selection<SVGGElement, unknown, null, undefined>,
    options: {
        size: number;
        color?: string;
    },
) {
    const {size, color} = options;

    const domainPath = selection
        .selectAll('.domain')
        .data([null])
        .enter()
        .insert('path', '.tick')
        .attr('class', 'domain')
        .attr('d', `M0,0V0H${size}`);

    if (color) {
        domainPath.style('stroke', color);
    }
}

function appendSvgLabels(args: {
    leftmostLimit: number;
    right: number;
    ticksSelection: Selection<BaseType | SVGGElement, unknown, SVGGElement, unknown>;
    ticks: Partial<AxisBottomArgs['ticks']> &
        DeepRequired<
            Pick<
                AxisBottomArgs['ticks'],
                | 'labelFormat'
                | 'labelsMaxWidth'
                | 'labelsMargin'
                | 'labelsPaddings'
                | 'labelsLineHeight'
            >
        >;
    transform: string;
    translateY: number;
    x: number;
}) {
    const {leftmostLimit, right, ticksSelection, ticks, transform, translateY, x} = args;

    ticksSelection
        .append('text')
        .text(ticks.labelFormat)
        .style('font-size', ticks.labelsStyle?.fontSize || '')
        .attr('fill', 'currentColor')
        .attr('text-anchor', () => {
            if (ticks.rotation) {
                return ticks.rotation > 0 ? 'start' : 'end';
            }
            return 'middle';
        })
        .style('transform', transform)
        .style('dominant-baseline', 'text-after-edge');

    const labels = ticksSelection.selectAll<SVGTextElement, unknown>('.tick text');

    // FIXME: handle rotated overlapping labels (with a smarter approach)
    if (ticks.rotation) {
        const maxWidth =
            ticks.labelsMaxWidth * calculateCos(ticks.rotation) +
            ticks.labelsLineHeight * calculateSin(ticks.rotation);
        labels.each(function () {
            setEllipsisForOverflowText(select(this), maxWidth);
        });
    } else {
        let elementX = 0;

        // add an ellipsis to the labels that go beyond the boundaries of the chart
        // and remove overlapping labels
        labels
            .nodes()
            .map((element) => {
                const r = (element as Element).getBoundingClientRect();

                return {
                    left: r.left,
                    right: r.right,
                    node: element as Element,
                };
            }, {})
            .sort((a, b) => {
                return a.left - b.left;
            })
            .forEach(function (item, i, nodes) {
                const {node, left, right: currentElementPositionRigth} = item;
                const currentElement = node as SVGTextElement;

                if (i === 0) {
                    const text = select(currentElement);

                    const nextElement = nodes[i + 1]?.node as SVGTextElement;
                    const nextElementPosition = nextElement?.getBoundingClientRect();

                    if (left < leftmostLimit) {
                        const rightmostPossiblePoint = nextElementPosition?.left ?? right;
                        const remainSpace =
                            rightmostPossiblePoint -
                            currentElementPositionRigth +
                            x -
                            ticks.labelsMargin;

                        text.attr('text-anchor', 'start');
                        setEllipsisForOverflowText(text, remainSpace);
                    }
                } else {
                    if (left < elementX) {
                        currentElement.closest('.tick')?.remove();
                        return;
                    }
                    elementX = currentElementPositionRigth + ticks.labelsPaddings;

                    if (i === nodes.length - 1) {
                        const prevElement = nodes[i - 1]?.node as SVGTextElement;
                        const text = select(currentElement);

                        const prevElementPosition = prevElement?.getBoundingClientRect();

                        const lackingSpace = Math.max(0, currentElementPositionRigth - right);
                        if (lackingSpace) {
                            const remainSpace =
                                right - (prevElementPosition?.right || 0) - ticks.labelsPaddings;

                            const translateX = -lackingSpace;
                            text.style('transform', `translate(${translateX}px,${translateY}px)`);

                            setEllipsisForOverflowText(text, remainSpace);
                        }
                    }
                }
            });
    }
}

function appendHtmlLabels(args: {
    htmlSelection: Selection<HTMLElement, unknown, null, undefined>;
    labelsData: HtmlLabelData[];
    right: number;
    ticks: Partial<AxisBottomArgs['ticks']> &
        DeepRequired<
            Pick<
                AxisBottomArgs['ticks'],
                'labelFormat' | 'labelsLineHeight' | 'labelsMaxWidth' | 'labelsPaddings'
            >
        >;
}) {
    const {htmlSelection, labelsData, right, ticks} = args;
    htmlSelection.append('div').attr('data-labels-axis-x', 1).style('position', 'absolute');
    labelsData.forEach((label) => {
        htmlSelection
            .selectAll(`[${HTML_LABELS_DATA_ATTR}]`)
            .data([label])
            .append('div')
            .html(function (d) {
                return ticks.labelFormat(d.content);
            })
            .style('font-size', ticks.labelsStyle?.fontSize || '')
            .style('position', 'absolute')
            .style('white-space', 'nowrap')
            .style('color', 'var(--g-color-text-secondary)')
            .style('overflow', 'hidden')
            .style('text-overflow', 'ellipsis')
            .style('left', function (d) {
                const rect = this.getBoundingClientRect();
                return `${d.left - rect.width / (ticks.rotation ? 1 : 2)}px`;
            })
            .style('top', function (d) {
                return `${d.top}px`;
            })
            .style('transform-origin', 'top right')
            .style('rotate', `${ticks.rotation}deg`);
    });

    const labelNodes = htmlSelection
        .selectAll<HTMLDivElement, unknown>(`[${HTML_LABELS_DATA_ATTR}] div`)
        .nodes();

    if (ticks.rotation) {
        const maxWidth =
            ticks.labelsMaxWidth * calculateCos(ticks.rotation) +
            ticks.labelsLineHeight * calculateSin(ticks.rotation);
        labelNodes.forEach((node) => {
            const nodeSelection = select(node);
            nodeSelection.style('max-width', `${maxWidth}px`);
        });
    } else {
        labelNodes.forEach((node, i, nodes) => {
            if (i === nodes.length - 1) {
                const prevNodeSelection = select(nodes[i - 1]);
                const prevRect = prevNodeSelection.node()?.getBoundingClientRect();
                const nodeSelection = select(node);
                const rect = node.getBoundingClientRect();
                const lackingSpace = rect.right - right;

                if (lackingSpace > 0) {
                    if (prevRect && prevRect.right > rect.left - lackingSpace) {
                        const translateX = -lackingSpace + ticks.labelsPaddings;
                        const widthOffset = rect.width - translateX * -1;
                        nodeSelection.style('transform', `translateX(${translateX}px)`);
                        nodeSelection.style('max-width', `${widthOffset}px`);
                    } else {
                        const translateX = -lackingSpace;
                        nodeSelection.style('transform', `translateX(${translateX}px)`);
                    }
                }
            }
        });
    }
}

export async function axisBottom(args: AxisBottomArgs) {
    const {
        boundsOffsetLeft = 0,
        htmlLayout,
        leftmostLimit = 0,
        scale,
        ticks: {
            count: ticksCount,
            items: tickItems,
            labelFormat = (value: unknown) => String(value),
            labelsHtml,
            labelsLineHeight,
            labelsMargin = 0,
            labelsMaxWidth = Infinity,
            labelsPaddings = 0,
            labelsStyle,
            maxTickCount,
            rotation = 0,
            tickColor,
        },
        domain,
    } = args;
    const offset = getXAxisOffset();
    const position = getXTickPosition({scale, offset});
    const values = getXAxisItems({scale, count: ticksCount, maxCount: maxTickCount});
    const {maxHeight: labelHeight} = await getLabelsSize({
        html: labelsHtml,
        labels: values.map(labelFormat),
        style: labelsStyle,
    });
    const htmlSelection = select(htmlLayout);

    return function (selection: Selection<SVGGElement, unknown, null, undefined>) {
        selection.selectAll('.tick, .domain').remove();
        htmlSelection.selectAll(`[${HTML_LABELS_DATA_ATTR}]`).remove();

        const rect = selection.node()?.getBoundingClientRect();
        const x = rect?.x || 0;

        const right = x + domain.size;
        const top = -(tickItems?.[0]?.[0] ?? 0);

        const translateY = labelHeight + labelsMargin - top;
        let transform = `translate(0, ${translateY}px)`;
        if (rotation) {
            const labelsOffsetTop = labelHeight * calculateCos(rotation) + labelsMargin - top;
            // const labelsOffsetTop = labelHeight * calculateCos(rotation) - top;
            let labelsOffsetLeft = calculateSin(rotation) * labelHeight;
            if (Math.abs(rotation) % 360 === 90) {
                labelsOffsetLeft += ((rotation > 0 ? -1 : 1) * labelHeight) / 2;
            }
            transform = `translate(${-labelsOffsetLeft}px, ${labelsOffsetTop}px) rotate(${rotation}deg)`;
        }

        const tickPath = path();
        tickItems?.forEach(([start, end]) => {
            tickPath.moveTo(0, start);
            tickPath.lineTo(0, end);
        });

        const htmlLabelsData: HtmlLabelData[] = [];

        const ticks = selection
            .selectAll('.tick')
            .data(values)
            .order()
            .join('g')
            .attr('class', 'tick')
            .attr('transform', function (d) {
                const left = position(d as AxisDomain) + offset;
                if (labelsHtml) {
                    htmlLabelsData.push({
                        left: left + boundsOffsetLeft,
                        // top: Math.abs(tickItems?.[0]?.[1] || 0) + (rotation ? 0 : labelsMargin),
                        top: Math.abs(tickItems?.[0]?.[1] || 0) + labelsMargin,
                        content: d as string,
                    });
                }
                return `translate(${left}, ${top})`;
            });

        ticks
            .append('path')
            .attr('d', tickPath.toString())
            .attr('stroke', tickColor ?? 'currentColor');

        // Remove tick that has the same x coordinate like domain
        selection
            .selectAll('.tick')
            .filter((d) => {
                return position(d as AxisDomain) === 0;
            })
            .select('path')
            .remove();

        if (labelsHtml) {
            appendHtmlLabels({
                labelsData: htmlLabelsData,
                htmlSelection,
                right,
                ticks: {
                    labelFormat,
                    labelsLineHeight,
                    labelsMaxWidth,
                    labelsPaddings,
                    labelsStyle,
                    rotation,
                },
            });
        } else {
            appendSvgLabels({
                leftmostLimit,
                right,
                ticksSelection: ticks,
                ticks: {
                    labelFormat,
                    labelsLineHeight,
                    labelsMaxWidth,
                    labelsMargin,
                    labelsPaddings,
                    labelsStyle,
                    rotation,
                },
                transform,
                translateY,
                x,
            });
        }

        const {size: domainSize, color: domainColor} = domain;
        selection.call(addDomain, {size: domainSize, color: domainColor});
    };
}
