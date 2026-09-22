import type {BaseTextStyle} from '../../types';
import {getLabelsSize, getTextSizeFn, getTextWithElipsis} from '../utils';

import type {LegendItem, PreparedLegend} from './types';

/** Wrap independently of title wrapping: legend labels also support hard breaks and long tokens. */
export async function wrapLegendLabel(args: {
    text: string;
    width: number;
    maxRowCount: number;
    getTextWidth: (text: string) => Promise<number>;
}) {
    const {text, width, maxRowCount, getTextWidth} = args;
    if (width <= 0 || maxRowCount <= 0) {
        return [];
    }

    const rows: string[] = [];
    for (const paragraph of text.split(/\r\n|\r|\n/)) {
        let row = '';
        for (const token of paragraph.match(/\S+\s*/gu) ?? []) {
            if (row && (await getTextWidth(row + token.trimEnd())) > width) {
                rows.push(row.trimEnd());
                row = '';
            }
            const trailingWhitespace = token.slice(token.trimEnd().length);
            let remaining = token.trimEnd();
            while ((await getTextWidth(remaining)) > width) {
                const characters = Array.from(remaining);
                let low = 0;
                let high = characters.length;
                while (low < high) {
                    const mid = Math.ceil((low + high) / 2);
                    if ((await getTextWidth(characters.slice(0, mid).join(''))) <= width) {
                        low = mid;
                    } else {
                        high = mid - 1;
                    }
                }
                // A glyph wider than the entire label cannot be displayed.
                rows.push(characters.slice(0, low).join(''));
                remaining = characters.slice(Math.max(1, low)).join('');
                if (rows.length > maxRowCount) {
                    break;
                }
            }
            row += remaining + trailingWhitespace;
            if (rows.length > maxRowCount) {
                break;
            }
        }
        rows.push(row.trimEnd());
        if (rows.length > maxRowCount) {
            break;
        }
    }

    if (rows.length > maxRowCount) {
        rows.length = maxRowCount;
        rows[maxRowCount - 1] = await getTextWithElipsis({
            text: rows[maxRowCount - 1] + '…',
            maxWidth: width,
            getTextWidth,
        });
    }
    return rows;
}

let labelDecoder: HTMLDivElement | undefined;

export function decodeLegendLabel(text: string) {
    if (!text.includes('&')) {
        return text;
    }
    labelDecoder ??= document.createElement('div');
    // Escape tag delimiters so only entities are decoded, never label markup.
    labelDecoder.innerHTML = text.replace(/</g, '&lt;');
    return labelDecoder.textContent ?? '';
}

async function measureHtmlLegendLabels(
    items: LegendItem[],
    widths: number[],
    style: BaseTextStyle,
    lineHeight: number,
) {
    if (!items.length) {
        return [];
    }
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'absolute',
        visibility: 'hidden',
        top: '-10000px',
        width: `${Math.max(0, ...widths)}px`,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: `${lineHeight}px`,
    });
    const elements = items.map((item, i) => {
        const element = document.createElement('div');
        Object.assign(element.style, {
            // Labels intentionally overlap; only their individual dimensions are measured.
            position: 'absolute',
            display: 'inline-block',
            maxWidth: `${widths[i]}px`,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
        });
        element.innerHTML = item.text;
        container.appendChild(element);
        return element;
    });
    document.body.appendChild(container);
    try {
        await document.fonts.ready;
        // All DOM writes precede the reads, so labels share a single layout pass.
        return elements.map((element, i) => {
            const rect = element.getBoundingClientRect();
            return {
                width: Math.min(widths[i], rect.width),
                rows: Math.max(1, Math.ceil(rect.height / lineHeight)),
            };
        });
    } finally {
        container.remove();
    }
}

async function prepareSingleLineLegendItem(
    item: LegendItem,
    maxWidth: number,
    legend: PreparedLegend,
    getTextSize: ReturnType<typeof getTextSizeFn>,
) {
    const {width, height} = legend.html
        ? await getLabelsSize({labels: [item.text], html: true, style: legend.itemStyle}).then(
              ({maxWidth: w, maxHeight: h}) => ({width: w, height: h}),
          )
        : await getTextSize(item.text);
    item.height = height;
    item.textWidth = width;
    if (width > maxWidth) {
        item.overflowed = true;
        if (legend.html) {
            item.textWidth = maxWidth;
        } else {
            item.text = await getTextWithElipsis({
                text: item.text,
                getTextWidth: async (text) => (await getTextSize(text)).width,
                maxWidth,
            });
            item.textWidth = (await getTextSize(item.text)).width;
        }
    }
}

export async function prepareLegendItems(args: {
    items: Omit<LegendItem, 'textWidth'>[];
    maxLegendWidth: number;
    legend: PreparedLegend;
}): Promise<LegendItem[]> {
    const {items, maxLegendWidth, legend} = args;
    const preparedItems: LegendItem[] = items.map((item) => ({
        ...item,
        text: item.name,
        textWidth: 0,
    }));
    const widths = preparedItems.map((item) =>
        Math.max(0, maxLegendWidth - item.symbol.bboxWidth - item.symbol.padding),
    );
    const multiline = legend.itemMaxRowCount > 1;
    if (multiline && legend.html) {
        const sizes = await measureHtmlLegendLabels(
            preparedItems,
            widths,
            legend.itemStyle,
            legend.lineHeight,
        );
        for (const [i, item] of preparedItems.entries()) {
            item.textWidth = sizes[i].width;
            item.textRowCount = Math.min(sizes[i].rows, legend.itemMaxRowCount);
            item.height = item.textRowCount * legend.lineHeight;
        }
        return preparedItems;
    }

    const getTextSize = getTextSizeFn({style: legend.itemStyle, decodeEntities: !multiline});
    const cache = new Map<string, number>();
    const getTextWidth = async (text: string) => {
        if (!cache.has(text)) {
            cache.set(text, (await getTextSize(text)).width);
        }
        return cache.get(text) ?? 0;
    };
    for (const [i, item] of preparedItems.entries()) {
        if (!multiline) {
            await prepareSingleLineLegendItem(item, widths[i], legend, getTextSize);
            continue;
        }
        item.textRows = await wrapLegendLabel({
            text: decodeLegendLabel(item.text),
            width: widths[i],
            maxRowCount: legend.itemMaxRowCount,
            getTextWidth,
        });
        item.textWidth = Math.max(0, ...(await Promise.all(item.textRows.map(getTextWidth))));
        item.textRowCount = item.textRows.length;
        item.height = Math.max(1, item.textRowCount) * legend.lineHeight;
    }
    return preparedItems;
}

export async function limitLegendItemRows(
    items: LegendItem[],
    maxRows: number,
    legend: PreparedLegend,
) {
    const getTextSize = getTextSizeFn({style: legend.itemStyle, decodeEntities: false});
    for (const item of items) {
        if ((item.textRowCount ?? 1) <= maxRows) {
            continue;
        }
        item.textRowCount = maxRows;
        item.height = maxRows * legend.lineHeight;
        item.overflowed = true;
        if (item.textRows) {
            item.textRows = item.textRows.slice(0, maxRows);
            item.textRows[maxRows - 1] = await getTextWithElipsis({
                text: item.textRows[maxRows - 1] + '…',
                maxWidth: item.textWidth,
                getTextWidth: async (text) => (await getTextSize(text)).width,
            });
        }
    }
}
