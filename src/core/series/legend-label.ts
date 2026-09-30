import {decodeHtmlEntities, getLabelsSize, getTextSizeFn, getTextWithElipsis} from '../utils';

import type {LegendItem, PreparedLegendOptions} from './types';

export function getLegendTextSizeFn(
    legend: PreparedLegendOptions,
): ReturnType<typeof getTextSizeFn> {
    const multiline = !legend.html && legend.itemMaxRowCount > 1;
    const measure = getTextSizeFn({style: legend.itemStyle, decodeEntities: !multiline});
    if (!multiline) {
        return measure;
    }

    const cache = new Map<string, ReturnType<typeof measure>>();
    return (text: string) => {
        let size = cache.get(text);
        if (!size) {
            size = measure(text);
            cache.set(text, size);
        }
        return size;
    };
}

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

async function prepareSingleLineLegendItem(
    item: LegendItem,
    maxWidth: number,
    legend: PreparedLegendOptions,
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
    legend: PreparedLegendOptions;
    symbolMetrics: {width: number; padding: number};
    getTextSize: ReturnType<typeof getTextSizeFn>;
}): Promise<LegendItem[]> {
    const {items, maxLegendWidth, legend, symbolMetrics, getTextSize} = args;
    const preparedItems: LegendItem[] = items.map((item) => ({
        ...item,
        text: item.name,
        textWidth: 0,
    }));
    const widths = preparedItems.map((item) =>
        Math.max(
            0,
            maxLegendWidth -
                (legend.layout === 'vertical'
                    ? symbolMetrics.width + symbolMetrics.padding
                    : item.symbol.bboxWidth + item.symbol.padding),
        ),
    );
    const multiline = !legend.html && legend.itemMaxRowCount > 1;

    const getTextWidth = async (text: string) => (await getTextSize(text)).width;
    for (const [i, item] of preparedItems.entries()) {
        if (!multiline) {
            await prepareSingleLineLegendItem(item, widths[i], legend, getTextSize);
            continue;
        }
        item.textRows = await wrapLegendLabel({
            text: decodeHtmlEntities(item.text),
            width: widths[i],
            maxRowCount: legend.itemMaxRowCount,
            getTextWidth,
        });
        item.textWidth = Math.max(0, ...(await Promise.all(item.textRows.map(getTextWidth))));
        item.height = Math.max(1, item.textRows.length) * legend.lineHeight;
    }
    return preparedItems;
}

export async function limitLegendItemRows(
    items: LegendItem[],
    maxRows: number,
    legend: PreparedLegendOptions,
    getTextSize: ReturnType<typeof getTextSizeFn>,
) {
    const getTextWidth = async (text: string) => (await getTextSize(text)).width;
    for (const item of items) {
        if (!item.textRows || item.textRows.length <= maxRows) {
            continue;
        }
        item.height = maxRows * legend.lineHeight;
        item.overflowed = true;
        item.textRows = item.textRows.slice(0, maxRows);
        item.textRows[maxRows - 1] = await getTextWithElipsis({
            text: item.textRows[maxRows - 1] + '…',
            maxWidth: item.textWidth,
            getTextWidth,
        });
        item.textWidth = Math.max(0, ...(await Promise.all(item.textRows.map(getTextWidth))));
    }
}
