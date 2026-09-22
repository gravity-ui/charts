import type {BaseTextStyle} from '../../types';
import {getTextSizeFn, getTextWithElipsis} from '../utils';

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

export function createLegendLabelMeasurer(style: BaseTextStyle, lineHeight: number, html: boolean) {
    const getTextSize = getTextSizeFn({style});
    const widths = new Map<string, number>();
    const element = document.createElement('div');
    if (html) {
        Object.assign(element.style, {
            position: 'absolute',
            visibility: 'hidden',
            display: 'inline-block',
            top: '-10000px',
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: `${lineHeight}px`,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
        });
        document.body.appendChild(element);
    }
    return {
        async getTextWidth(text: string) {
            if (!widths.has(text)) {
                widths.set(text, (await getTextSize(text)).width);
            }
            return widths.get(text) ?? 0;
        },
        decode(text: string) {
            element.innerHTML = text;
            return element.textContent ?? '';
        },
        async measureHtml(text: string, width: number) {
            element.innerHTML = text;
            element.style.maxWidth = `${width}px`;
            await document.fonts.ready;
            const rect = element.getBoundingClientRect();
            return {
                width: Math.min(width, rect.width),
                rows: Math.max(1, Math.ceil(rect.height / lineHeight)),
            };
        },
        destroy() {
            element.remove();
        },
    };
}

export async function limitLegendItemRows(
    items: LegendItem[],
    maxRows: number,
    legend: PreparedLegend,
) {
    const getTextSize = getTextSizeFn({style: legend.itemStyle});
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
