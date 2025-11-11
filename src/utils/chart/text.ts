import type {Selection} from 'd3';
import {select} from 'd3-selection';

import type {BaseTextStyle, MeaningfulAny} from '../../types';
import {block} from '../cn';

const b = block('chart');

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
        .html((d) => d);

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
    getTextSize?: ReturnType<typeof getTextSizeFn>;
}): Promise<TextRow[]> {
    const {text, style, width, getTextSize = getTextSizeFn({style})} = args;

    const height = (await getTextSize(text)).height;
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

        if (item.isWordLike && (await getTextSize(lastRow.text + item.segment)).width > width) {
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

function getCssStyle(prop: string, el: Element = document.body) {
    return window.getComputedStyle(el, null).getPropertyValue(prop);
}

let measureCanvas: HTMLCanvasElement | null = null;
export function getTextSizeFn({style}: {style?: BaseTextStyle}) {
    const canvas = measureCanvas || (measureCanvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error("Couldn't get canvas context");
    }

    const element = document.getElementsByClassName(b())[0] ?? document.body;
    const defaultFontFamily = getCssStyle('font-family', element);
    const defaultFontSize = getCssStyle('font-size', element);
    const defaultFontWeight = getCssStyle('font-weight', element);

    return async (str: string) => {
        await document.fonts.ready;
        context.font = `${style?.fontWeight ?? defaultFontWeight} ${style?.fontSize ?? defaultFontSize} ${defaultFontFamily}`;
        const textMetric = context.measureText(unescapeHtml(str));

        return {
            width: textMetric.width,
            height: textMetric.fontBoundingBoxDescent + textMetric.fontBoundingBoxAscent,
        };
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
