import type {Selection} from 'd3';
import {select} from 'd3-selection';

import type {BaseTextStyle, MeaningfulAny} from '../../types';

export function handleOverflowingText(
    tSpan: SVGTSpanElement | null,
    maxWidth: number,
    textWidth?: number,
) {
    if (!tSpan) {
        return;
    }

    const svg = tSpan.closest('svg');
    if (!svg) {
        return;
    }

    let text = tSpan.textContent || '';
    // We believe that if the text goes beyond the boundaries of less than a pixel, it's not a big deal.
    // Math.floor helps to solve the problem with the difference in rounding when comparing textLength with maxWidth.
    let textLength = textWidth ?? Math.floor(tSpan.getBoundingClientRect()?.width || 0);

    if (textLength < maxWidth) {
        return;
    }

    const textNode = tSpan.closest('text');
    const angle =
        Array.from(textNode?.transform.baseVal || []).find((item) => item.angle)?.angle || 0;

    if (angle) {
        const revertRotation = svg.createSVGTransform();
        revertRotation.setRotate(-angle, 0, 0);
        textNode?.transform.baseVal.appendItem(revertRotation);
    }

    while (textLength > maxWidth && text.length > 1) {
        text = text.slice(0, -1);
        tSpan.textContent = text + '…';
        textLength = tSpan.getBoundingClientRect()?.width || 0;
    }

    if (textLength > maxWidth) {
        tSpan.textContent = '';
    }

    if (angle) {
        textNode?.transform.baseVal.removeItem(textNode?.transform.baseVal.length - 1);
    }
}

export function setEllipsisForOverflowText<T>(
    selection: Selection<SVGTextElement, T, null, unknown>,
    maxWidth: number,
    textWidth?: number,
) {
    const originalTextWidth =
        textWidth ?? Math.floor(selection.node()?.getBoundingClientRect()?.width || 0);
    if (originalTextWidth <= maxWidth) {
        return;
    }

    const text = selection.text();
    selection.text(null).append('title').text(text);
    const tSpan = selection.append('tspan').text(text).style('dominant-baseline', 'inherit');
    handleOverflowingText(tSpan.node(), maxWidth, originalTextWidth);
}

export function setEllipsisForOverflowTexts<T>(
    selection: Selection<SVGTextElement, T, MeaningfulAny, unknown>,
    maxWidth: ((datum: T) => number) | number,
    currentWidth?: (datum: T) => number,
) {
    selection.each(function (datum) {
        const textSelection = select(this);
        const textMaxWidth = typeof maxWidth === 'function' ? maxWidth(datum) : maxWidth;
        const textWidth = currentWidth
            ? currentWidth(datum)
            : Math.floor(textSelection.node()?.getBoundingClientRect()?.width || 0);
        setEllipsisForOverflowText(textSelection, textMaxWidth, textWidth);
    });
}

export function hasOverlappingLabels({
    width,
    labels,
    padding = 0,
    style,
    html,
}: {
    width: number;
    labels: string[];
    style?: BaseTextStyle;
    padding?: number;
    html?: boolean;
}) {
    const maxWidth = (width - padding * (labels.length - 1)) / labels.length;
    let textSvgSelection: Selection<SVGTextElement, unknown, null, undefined> | undefined;
    let textHtmlSelection: Selection<HTMLDivElement, unknown, null, undefined> | undefined;

    if (html) {
        textHtmlSelection = select(document.body)
            .append('div')
            .style('display', 'inline-block')
            .style('font-size', style?.fontSize || '');
    } else {
        textSvgSelection = select(document.body)
            .append('text')
            .style('font-size', style?.fontSize || '');
    }

    const result = labels.some((label) => {
        let textWidth = 0;

        if (textSvgSelection) {
            textWidth = textSvgSelection.text(label).node()?.getBoundingClientRect()?.width || 0;
        } else if (textHtmlSelection) {
            textWidth = textHtmlSelection.html(label).node()?.getBoundingClientRect()?.width || 0;
        }

        return textWidth > maxWidth;
    });

    (textHtmlSelection || textSvgSelection)?.remove();

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

    const tspanSelection = text
        .selectAll('tspan')
        .data(labels)
        .enter()
        .append('tspan')
        .attr('x', 0)
        .attr('dy', 0)
        .html((d) => d);

    const labelLength = labels.join('').length;

    if (labelLength > 0 && text.node()?.clientWidth === 0) {
        tspanSelection.text((d) => d);
    }

    return text;
}

// since we don't know in advance the font that will be used for the text,
// we need to wait for it and only then we can count all the sizes.
export async function getLabelsSize({
    labels,
    style,
    rotation,
    html,
}: {
    labels: string[];
    style?: BaseTextStyle & React.CSSProperties;
    rotation?: number;
    html?: boolean;
}) {
    if (!labels.filter(Boolean).length) {
        return {maxHeight: 0, maxWidth: 0};
    }

    const container = select(document.body)
        .append('div')
        .style('visibility', 'hidden')
        .style('position', 'absolute')
        .style('top', '-200vw')
        .style('left', '-200vwx')
        .style('width', '100vw')
        .style('height', '100vh');
    const result = {maxHeight: 0, maxWidth: 0};
    let labelWrapper: HTMLElement | null;

    if (html) {
        labelWrapper = container
            .append('div')
            .style('position', 'absolute')
            .style('display', 'inline-block')
            .style('font-size', style?.fontSize ?? '')
            .style('font-weight', style?.fontWeight ?? '')
            .style('max-width', style?.maxWidth ?? '')
            .style('max-height', style?.maxHeight ?? '')
            .style('transform', `rotate(${rotation}deg)`)
            .node();

        let height = 0;
        let width = 0;

        for (let i = 0; i < labels.length; i++) {
            const l = labels[i];
            if (labelWrapper) {
                labelWrapper.innerHTML = l;
            }

            await document.fonts.ready;

            const rect = labelWrapper?.getBoundingClientRect();

            width = Math.max(width, rect?.width ?? 0);
            height = Math.max(height, rect?.height ?? 0);
        }

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

        await document.fonts.ready;
        const rect = (svg.select('g').node() as Element)?.getBoundingClientRect();
        result.maxWidth = rect?.width ?? 0;
        result.maxHeight = rect?.height ?? 0;
    }

    container.remove();

    return result;
}

export type TextRow = {text: string; y: number};

export async function wrapText(args: {
    text: string;
    style?: BaseTextStyle;
    width: number;
}): Promise<TextRow[]> {
    const {text, style, width} = args;

    const height = (
        await getLabelsSize({
            labels: [text],
            style: style,
        })
    ).maxHeight;
    // @ts-ignore
    const segmenter = new Intl.Segmenter([], {granularity: 'word'});
    const segments = Array.from(segmenter.segment(text));

    const acc: TextRow[] = [];
    for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
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
            (
                await getLabelsSize({
                    labels: [lastRow.text + item.segment],
                    style,
                })
            ).maxWidth > width
        ) {
            lastRow = {
                text: '',
                y: acc.length * height,
            };
            acc.push(lastRow);
        }

        lastRow.text += item.segment;
    }

    return acc;
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

function unescapeHtml(str: string) {
    return Object.entries(entityMap).reduce((result, [key, value]) => {
        return result.replace(value, key);
    }, str);
}

export function getTextSizeFn({style}: {style: BaseTextStyle}) {
    const map: Record<string, {width: number; height: number}> = {};
    const setSymbolSize = async (s: string) => {
        const labels = [s === ' ' ? '&nbsp;' : s];
        const size = await getLabelsSize({
            labels,
            style,
        });
        map[s] = {width: size.maxWidth, height: size.maxHeight};
    };

    return async (str: string) => {
        let width = 0;
        let height = 0;

        const symbols = unescapeHtml(str);
        for (let i = 0; i < symbols.length; i++) {
            const s = symbols[i];
            if (!map[s]) {
                await setSymbolSize(s);
            }

            width += map[s].width;
            height = Math.max(height, map[s].height);
        }

        return {width, height};
    };
}

// We ignore an inaccuracy of less than a pixel.
// To do this, we round the font size down when comparing it, and the size of the allowed space up.
export async function getTextWithElipsis({
    text: originalText,
    getTextWidth,
    maxWidth,
}: {
    text: string;
    getTextWidth: (s: string) => number | Promise<number>;
    maxWidth: number;
}) {
    let textWidth = Math.floor(await getTextWidth(originalText));
    const textMaxWidth = Math.ceil(maxWidth);

    if (textWidth <= textMaxWidth) {
        return originalText;
    }

    let text = originalText + '…';
    while (textWidth > textMaxWidth && text.length > 2) {
        text = text.slice(0, -2) + '…';
        textWidth = Math.floor(await getTextWidth(text));
    }

    if (textWidth > textMaxWidth) {
        text = '';
    }

    return text;
}
