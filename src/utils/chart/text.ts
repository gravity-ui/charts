import type {Selection} from 'd3';
import {select} from 'd3-selection';

import type {BaseTextStyle, MeaningfulAny} from '../../types';

export function handleOverflowingText(tSpan: SVGTSpanElement | null, maxWidth: number) {
    if (!tSpan) {
        return;
    }

    const svg = tSpan.closest('svg');
    if (!svg) {
        return;
    }

    const textNode = tSpan.closest('text');
    const angle =
        Array.from(textNode?.transform.baseVal || []).find((item) => item.angle)?.angle || 0;

    const revertRotation = svg.createSVGTransform();
    revertRotation.setRotate(-angle, 0, 0);
    textNode?.transform.baseVal.appendItem(revertRotation);

    let text = tSpan.textContent || '';
    let textLength = tSpan.getBoundingClientRect()?.width || 0;

    while (textLength > maxWidth && text.length > 1) {
        text = text.slice(0, -1);
        tSpan.textContent = text + '…';
        textLength = tSpan.getBoundingClientRect()?.width || 0;
    }

    textNode?.transform.baseVal.removeItem(textNode?.transform.baseVal.length - 1);
}

export function setEllipsisForOverflowText<T>(
    selection: Selection<SVGTextElement, T, null, unknown>,
    maxWidth: number,
) {
    const text = selection.text();
    selection.text(null).append('title').text(text);
    const tSpan = selection.append('tspan').text(text).style('alignment-baseline', 'inherit');
    handleOverflowingText(tSpan.node(), maxWidth);
}

export function setEllipsisForOverflowTexts<T>(
    selection: Selection<SVGTextElement, T, MeaningfulAny, unknown>,
    maxWidth: ((datum: T) => number) | number,
) {
    selection.each(function (datum) {
        const textMaxWidth = typeof maxWidth === 'function' ? maxWidth(datum) : maxWidth;
        setEllipsisForOverflowText(select(this), textMaxWidth);
    });
}

export function hasOverlappingLabels({
    width,
    labels,
    padding = 0,
    style,
}: {
    width: number;
    labels: string[];
    style?: BaseTextStyle;
    padding?: number;
}) {
    const maxWidth = (width - padding * (labels.length - 1)) / labels.length;

    const textElement = select(document.body)
        .append('text')
        .style('font-size', style?.fontSize || '');

    const result = labels.some((label) => {
        const textWidth = textElement.text(label).node()?.getBoundingClientRect()?.width || 0;
        return textWidth > maxWidth;
    });

    textElement.remove();

    return result;
}

function renderLabels(
    selection: Selection<SVGSVGElement, unknown, null, undefined>,
    {
        labels,
        style = {},
        attrs = {},
    }: {
        labels: string[];
        style?: Partial<BaseTextStyle>;
        attrs?: Record<string, string>;
    },
) {
    const text = selection.append('g').append('text');

    text.style('font-size', style.fontSize || '');
    text.style('font-weight', style.fontWeight || '');

    Object.entries(attrs).forEach(([name, value]) => {
        text.attr(name, value);
    });

    text.selectAll('tspan')
        .data(labels)
        .enter()
        .append('tspan')
        .attr('x', 0)
        .attr('dy', 0)
        .text((d) => d);

    return text;
}

export function getLabelsSize({
    labels,
    style,
    rotation,
    html,
}: {
    labels: string[];
    style?: BaseTextStyle;
    rotation?: number;
    html?: boolean;
}) {
    if (!labels.filter(Boolean).length) {
        return {maxHeight: 0, maxWidth: 0};
    }

    const container = select(document.body).append('div');
    // TODO: Why do we need this styles?
    // .attr('class', 'chartkit chartkit-theme_common');

    const result = {maxHeight: 0, maxWidth: 0};
    let labelWrapper: HTMLElement | null;
    if (html) {
        labelWrapper = container.append('div').style('position', 'absolute').node();
        const {height, width} = labels.reduce(
            (acc, l) => {
                if (labelWrapper) {
                    labelWrapper.innerHTML = l;
                }
                const rect = labelWrapper?.getBoundingClientRect();
                return {
                    width: Math.max(acc.width, rect?.width ?? 0),
                    height: Math.max(acc.height, rect?.height ?? 0),
                };
            },
            {height: 0, width: 0},
        );

        result.maxWidth = width;
        result.maxHeight = height;
    } else {
        const svg = container.append('svg');
        const textSelection = renderLabels(svg, {labels, style});
        if (rotation) {
            textSelection
                .attr('text-anchor', rotation > 0 ? 'start' : 'end')
                .style('transform', `rotate(${rotation}deg)`);
        }

        const rect = (svg.select('g').node() as Element)?.getBoundingClientRect();
        result.maxWidth = rect?.width ?? 0;
        result.maxHeight = rect?.height ?? 0;
    }

    container.remove();

    return result;
}

export type TextRow = {text: string; y: number};

export function wrapText(args: {text: string; style?: BaseTextStyle; width: number}): TextRow[] {
    const {text, style, width} = args;

    const height = getLabelsSize({
        labels: [text],
        style: style,
    }).maxHeight;
    // @ts-ignore
    const segmenter = new Intl.Segmenter([], {granularity: 'word'});
    const segments = Array.from(segmenter.segment(text));

    return segments.reduce<TextRow[]>((acc, s) => {
        const item = s as {isWordLike: boolean; segment: string};
        if (!acc.length) {
            acc.push({
                text: '',
                y: acc.length * height,
            });
        }

        let lastRow = acc[acc.length - 1];

        if (
            item.isWordLike &&
            getLabelsSize({
                labels: [lastRow.text + item.segment],
                style,
            }).maxWidth > width
        ) {
            lastRow = {
                text: '',
                y: acc.length * height,
            };
            acc.push(lastRow);
        }

        lastRow.text += item.segment;

        return acc;
    }, []);
}
