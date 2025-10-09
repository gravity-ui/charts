import type {AxisDomain, AxisScale, Selection} from 'd3';
import {path, select} from 'd3';

import type {BaseTextStyle} from '../../../types';
import {getXAxisItems, getXAxisOffset, getXTickPosition} from '../axis';
import {calculateCos, calculateSin} from '../math';
import {getLabelsSize, setEllipsisForOverflowText} from '../text';

type AxisBottomArgs = {
    scale: AxisScale<AxisDomain>;
    ticks: {
        count?: number;
        maxTickCount?: number;
        labelFormat?: (value: any) => string;
        labelsPaddings?: number;
        labelsMargin?: number;
        labelsStyle?: BaseTextStyle;
        labelsMaxWidth?: number;
        labelsLineHeight: number;
        items?: [number, number][];
        rotation?: number;
        tickColor?: string;
    };
    domain: {
        size: number;
        color?: string;
    };
    leftmostLimit?: number;
};

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

export async function axisBottom(args: AxisBottomArgs) {
    const {
        leftmostLimit = 0,
        scale,
        ticks: {
            labelFormat = (value: unknown) => String(value),
            labelsPaddings = 0,
            labelsMargin = 0,
            labelsMaxWidth = Infinity,
            labelsStyle,
            labelsLineHeight,
            items: tickItems,
            count: ticksCount,
            maxTickCount,
            rotation = 0,
            tickColor,
        },
        domain,
    } = args;
    const offset = getXAxisOffset();
    const position = getXTickPosition({scale, offset});
    const values = getXAxisItems({scale, count: ticksCount, maxCount: maxTickCount});
    const labelHeight = (
        await getLabelsSize({
            labels: values.map(labelFormat),
            style: labelsStyle,
        })
    ).maxHeight;

    return function (selection: Selection<SVGGElement, unknown, null, undefined>) {
        selection.selectAll('.tick, .domain').remove();

        const rect = selection.node()?.getBoundingClientRect();
        const x = rect?.x || 0;

        const right = x + domain.size;
        const top = -(tickItems?.[0]?.[0] ?? 0);

        const translateY = labelHeight + labelsMargin - top;
        let transform = `translate(0, ${translateY}px)`;
        if (rotation) {
            const labelsOffsetTop = labelHeight * calculateCos(rotation) + labelsMargin - top;
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

        const ticks = selection
            .selectAll('.tick')
            .data(values)
            .order()
            .join('g')
            .attr('class', 'tick')
            .attr('transform', function (d) {
                const left = position(d as AxisDomain) + offset;
                return `translate(${left}, ${top})`;
            });

        ticks
            .append('path')
            .attr('d', tickPath.toString())
            .attr('stroke', tickColor ?? 'currentColor');
        ticks
            .append('text')
            .text(labelFormat)
            .style('font-size', labelsStyle?.fontSize || '')
            .attr('fill', 'currentColor')
            .attr('text-anchor', () => {
                if (rotation) {
                    return rotation > 0 ? 'start' : 'end';
                }
                return 'middle';
            })
            .style('transform', transform)
            .style('dominant-baseline', 'text-after-edge');

        // Remove tick that has the same x coordinate like domain
        selection
            .selectAll('.tick')
            .filter((d) => {
                return position(d as AxisDomain) === 0;
            })
            .select('path')
            .remove();

        const labels = selection.selectAll<SVGTextElement, unknown>('.tick text');

        // FIXME: handle rotated overlapping labels (with a smarter approach)
        if (rotation) {
            const maxWidth =
                labelsMaxWidth * calculateCos(rotation) + labelsLineHeight * calculateSin(rotation);
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
                                labelsMargin;

                            text.attr('text-anchor', 'start');
                            setEllipsisForOverflowText(text, remainSpace);
                        }
                    } else {
                        if (left < elementX) {
                            currentElement.closest('.tick')?.remove();
                            return;
                        }
                        elementX = currentElementPositionRigth + labelsPaddings;

                        if (i === nodes.length - 1) {
                            const prevElement = nodes[i - 1]?.node as SVGTextElement;
                            const text = select(currentElement);

                            const prevElementPosition = prevElement?.getBoundingClientRect();

                            const lackingSpace = Math.max(0, currentElementPositionRigth - right);
                            if (lackingSpace) {
                                const remainSpace =
                                    right - (prevElementPosition?.right || 0) - labelsPaddings;

                                const translateX = -lackingSpace;
                                text.style(
                                    'transform',
                                    `translate(${translateX}px,${translateY}px)`,
                                );

                                setEllipsisForOverflowText(text, remainSpace);
                            }
                        }
                    }
                });
        }

        const {size: domainSize, color: domainColor} = domain;
        selection.call(addDomain, {size: domainSize, color: domainColor});
    };
}
