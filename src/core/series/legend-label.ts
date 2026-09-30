import memoize from 'lodash/memoize';

import {
    decodeHtmlEntities,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
    wrapTextWithEllipsis,
} from '../utils';

import type {LegendItem, PreparedLegendOptions} from './types';

export function getLegendTextSizeFn(
    legend: PreparedLegendOptions,
): ReturnType<typeof getTextSizeFn> {
    const multiline = !legend.html && legend.itemMaxRowCount > 1;
    const measure = getTextSizeFn({style: legend.itemStyle, decodeEntities: !multiline});
    return multiline ? memoize(measure) : measure;
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
        item.textRows = await wrapTextWithEllipsis({
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
