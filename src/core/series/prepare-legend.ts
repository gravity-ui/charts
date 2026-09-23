import clone from 'lodash/clone';
import get from 'lodash/get';
import merge from 'lodash/merge';

import type {BaseTextStyle, ChartData, LegendConfig} from '../../types';
import type {PreparedChart} from '../chart/types';
import {CONTINUOUS_LEGEND_SIZE, legendDefaults} from '../constants';
import {
    getDefaultColorStops,
    getDomainForContinuousColorScale,
    getLabelsSize,
    getSymbolSize,
    getTextSizeFn,
    getTextWithElipsis,
    parseLegendWidth,
} from '../utils';

import type {
    LegendItem,
    PreparedLegend,
    PreparedLegendRow,
    PreparedLegendSymbol,
    PreparedSeries,
} from './types';

type LegendItemWithoutTextWidth = Omit<LegendItem, 'textWidth'>;

interface LegendSymbolMetrics {
    width: number;
    padding: number;
}

/** Resolve legend options before series preparation; finalizePreparedLegend computes row geometry and height. */
export async function getPreparedLegend(args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
    chartWidth: number;
    // Use resolved chart margins before legend and axis space is deducted.
    chartMargin: PreparedChart['margin'];
}): Promise<PreparedLegend> {
    const {legend, series, chartWidth, chartMargin} = args;
    const availableWidth = Math.max(0, chartWidth - chartMargin.left - chartMargin.right);
    const parsedWidth = parseLegendWidth(legend?.width);
    let width = parsedWidth?.value;
    if (parsedWidth?.unit === '%') {
        // Cap before multiplication so even very large finite percentages cannot overflow.
        width = availableWidth * (Math.min(parsedWidth.value, 100) / 100);
    }
    const position = legend?.position ?? 'bottom';
    const margin = legend?.margin ?? legendDefaults.margin;
    const seriesWithEnabledLegend = series.filter((s) => s.legend?.enabled !== false);
    const enabled = Boolean(
        typeof legend?.enabled === 'boolean' ? legend?.enabled : seriesWithEnabledLegend.length > 1,
    );
    const defaultItemStyle = clone(legendDefaults.itemStyle);
    const itemStyle = get(legend, 'itemStyle');
    const computedItemStyle = merge(defaultItemStyle, itemStyle);
    const {height: lineHeight, hangingOffset: itemHangingOffset} = await getTextSizeFn({
        style: computedItemStyle,
    })('Tmp');
    const legendType = get(legend, 'type', 'discrete');
    const isTitleEnabled = Boolean(legend?.title?.text);
    const titleMargin = isTitleEnabled ? get(legend, 'title.margin', 4) : 0;
    const titleStyle: BaseTextStyle = {
        fontSize: '12px',
        fontWeight: 'bold',
        ...get(legend, 'title.style'),
    };
    const titleText = isTitleEnabled ? get(legend, 'title.text', '') : '';
    const titleTextSize = await getTextSizeFn({style: titleStyle})(titleText);
    const titleHeight = isTitleEnabled ? titleTextSize.height : 0;
    const titleHangingOffset = titleTextSize.hangingOffset;
    const tickStyle: BaseTextStyle = {
        fontSize: '12px',
    };

    const ticks = {
        labelsMargin: 4,
        labelsLineHeight: (await getTextSizeFn({style: tickStyle})('Tmp')).height,
        style: tickStyle,
    };

    const colorScale: PreparedLegend['colorScale'] = {
        colors: [],
        domain: [],
        stops: [],
    };

    let height = 0;
    let legendWidth = 0;
    if (enabled) {
        height += titleHeight + titleMargin;
        if (legendType === 'continuous') {
            legendWidth = width ?? CONTINUOUS_LEGEND_SIZE.width;
            height += CONTINUOUS_LEGEND_SIZE.height;
            height += ticks.labelsLineHeight + ticks.labelsMargin;

            colorScale.colors = legend?.colorScale?.colors ?? [];
            colorScale.stops =
                legend?.colorScale?.stops ?? getDefaultColorStops(colorScale.colors.length);
            colorScale.domain =
                legend?.colorScale?.domain ?? getDomainForContinuousColorScale({series});
        } else {
            height += lineHeight;
            legendWidth =
                width === undefined
                    ? getDefaultDiscreteLegendWidth({availableWidth, position, margin})
                    : Math.max(0, Math.min(width, availableWidth));
        }
    }
    return {
        layout: get(legend, 'layout', legendDefaults.layout),
        rows: [],
        align: get(legend, 'align', legendDefaults.align),
        verticalAlign: get(legend, 'verticalAlign', legendDefaults.verticalAlign),
        justifyContent: get(legend, 'justifyContent', legendDefaults.justifyContent),
        enabled,
        hangingOffset: itemHangingOffset,
        height,
        itemDistance: get(legend, 'itemDistance', legendDefaults.itemDistance),
        itemStyle: computedItemStyle,
        lineHeight,
        margin,
        type: legendType,
        title: {
            enable: isTitleEnabled,
            hangingOffset: titleHangingOffset,
            text: titleText,
            margin: titleMargin,
            style: titleStyle,
            height: titleHeight,
            align: get(legend, 'title.align', 'left'),
        },
        resolvedWidth: legendWidth,
        availableWidth,
        ticks,
        colorScale,
        html: get(legend, 'html', false),
        position,
    };
}

function getFlattenLegendItems(series: PreparedSeries[], preparedLegend: PreparedLegend) {
    const grouped = new Map<string, PreparedSeries[]>();

    series.forEach((item) => {
        const groupId = item.legend.groupId;
        const items = grouped.get(groupId);

        if (items) {
            items.push(item);
        } else {
            grouped.set(groupId, [item]);
        }
    });

    return Array.from(grouped.values()).reduce<LegendItemWithoutTextWidth[]>((acc, items) => {
        const s = items.find((item) => item.legend.enabled);

        if (s) {
            acc.push({
                ...s,
                color: s.legend.color ?? s.color,
                id: s.legend.groupId,
                name: s.legend.itemText,
                text: s.legend.itemText,
                height: preparedLegend.lineHeight,
                symbol: s.legend.symbol,
            });
        }

        return acc;
    }, []);
}

async function getGroupedLegendItems(args: {
    maxLegendWidth: number;
    items: LegendItemWithoutTextWidth[];
    preparedLegend: PreparedLegend;
    symbolMetrics: LegendSymbolMetrics;
}) {
    const {maxLegendWidth, items, preparedLegend, symbolMetrics} = args;
    if (maxLegendWidth <= 0) {
        return [];
    }

    const result: LegendItem[][] = [];
    let currentLine: LegendItem[] = [];
    let currentWidth = 0;

    const getLegendItemTextSize = getTextSizeFn({style: preparedLegend.itemStyle});
    const vertical = preparedLegend.layout === 'vertical';
    const {width: symbolWidth, padding: symbolPadding} = symbolMetrics;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const resultItem = clone(item) as LegendItem;
        resultItem.text = item.name;

        const maxTextWidth = Math.max(
            0,
            maxLegendWidth -
                (vertical
                    ? symbolWidth + symbolPadding
                    : resultItem.symbol.bboxWidth + resultItem.symbol.padding),
        );

        let textHeight = 0;
        let textWidth = 0;
        if (preparedLegend.html) {
            const textSize = await getLabelsSize({
                labels: [resultItem.text],
                html: true,
                style: preparedLegend.itemStyle,
            });
            textHeight = textSize.maxHeight;
            textWidth = textSize.maxWidth;
        } else {
            const textSize = await getLegendItemTextSize(resultItem.text);
            textHeight = textSize.height;
            textWidth = textSize.width;
        }

        resultItem.height = textHeight;

        if (textWidth > maxTextWidth) {
            resultItem.overflowed = true;

            if (preparedLegend.html) {
                resultItem.textWidth = maxTextWidth;
            } else {
                resultItem.text = await getTextWithElipsis({
                    text: resultItem.text,
                    getTextWidth: async (s: string) => (await getLegendItemTextSize(s)).width,
                    maxWidth: maxTextWidth,
                });
                resultItem.textWidth = (await getLegendItemTextSize(resultItem.text)).width;
            }
        } else {
            resultItem.textWidth = textWidth;
        }

        if (vertical) {
            result.push([resultItem]);
            continue;
        }

        const itemWidth =
            resultItem.textWidth + resultItem.symbol.bboxWidth + resultItem.symbol.padding;
        // A symbol alone can exceed the available width, even after truncating its label.
        // Keep that item on its own row instead of creating an empty row before it.
        if (
            currentLine.length > 0 &&
            ((currentLine.length === 1 && currentLine[0].overflowed) ||
                currentWidth + preparedLegend.itemDistance + itemWidth > maxLegendWidth)
        ) {
            currentLine = [];
            currentWidth = 0;
        }
        if (currentLine.length === 0) {
            result.push(currentLine);
        } else {
            currentWidth += preparedLegend.itemDistance;
        }
        currentLine.push(resultItem);
        currentWidth += itemWidth;
    }

    return result;
}

function getPagination(args: {
    rows: PreparedLegendRow[];
    maxLegendHeight: number;
    paginatorHeight: number;
}) {
    const {rows, maxLegendHeight, paginatorHeight} = args;
    const pages: NonNullable<LegendConfig['pagination']>['pages'] = [];
    let currentHeight = 0;
    rows.forEach((row, i) => {
        if (!pages.length || currentHeight + row.height > maxLegendHeight - paginatorHeight) {
            pages.push({start: i, end: i + 1});
            currentHeight = 0;
        }
        pages[pages.length - 1].end = i + 1;
        currentHeight += row.height;
    });
    return {pages};
}

function getLegendSymbolHeight(symbol: PreparedLegendSymbol): number {
    switch (symbol.shape) {
        case 'rect':
            return symbol.height;
        case 'path':
            // Legend paths are horizontal, stroke-based lines, not arbitrary SVG paths.
            return symbol.strokeWidth;
        case 'symbol':
            return getSymbolSize({
                symbolSize: Math.pow(symbol.width, 2),
                symbolType: symbol.symbolType,
            }).height;
        default:
            return 0;
    }
}

function getLegendRows(
    items: LegendItem[][],
    legend: PreparedLegend,
    maxWidth: number,
    symbolMetrics: LegendSymbolMetrics,
): PreparedLegendRow[] {
    const vertical = legend.layout === 'vertical';
    const {width: symbolWidth, padding: symbolPadding} = symbolMetrics;
    // Keep vertical alignment stable across pages, including pages with shorter labels.
    const listWidth = vertical
        ? symbolWidth + symbolPadding + Math.max(0, ...items.flat().map((item) => item.textWidth))
        : 0;
    let top = 0;
    return items.map((line) => {
        let width = 0;
        const positions = line.map((item) => {
            const symbolLeft = vertical ? (symbolWidth - item.symbol.bboxWidth) / 2 : width;
            const textLeft = vertical
                ? symbolWidth + symbolPadding
                : width + item.symbol.bboxWidth + item.symbol.padding;
            width = textLeft + item.textWidth + legend.itemDistance;
            return {symbolLeft, textLeft};
        });
        width -= legend.itemDistance;
        const height = Math.max(
            0,
            ...line.map((item) => Math.max(item.height, getLegendSymbolHeight(item.symbol))),
        );
        const remainingWidth = Math.max(0, maxWidth - (vertical ? listWidth : width));
        let left = 0;
        if (vertical || legend.justifyContent === 'center') {
            if (legend.align === 'right') {
                left = remainingWidth;
            } else if (legend.align === 'center') {
                left = remainingWidth / 2;
            }
        }
        const row = {top, left, height, width, items: positions};
        top += height;
        return row;
    });
}

function getLegendOffset(args: {
    position: PreparedLegend['position'];
    verticalAlign: PreparedLegend['verticalAlign'];
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    legendWidth: number;
    legendHeight: number;
}): LegendConfig['offset'] {
    const {
        position,
        verticalAlign,
        chartWidth,
        chartHeight,
        chartMargin,
        legendWidth,
        legendHeight,
    } = args;

    const getVerticalTop = () => {
        const availableHeight = chartHeight - chartMargin.top - chartMargin.bottom;
        switch (verticalAlign) {
            case 'bottom':
                return chartMargin.top + availableHeight - legendHeight;
            case 'center':
                return chartMargin.top + (availableHeight - legendHeight) / 2;
            case 'top':
            default:
                return chartMargin.top;
        }
    };

    switch (position) {
        case 'top':
            return {
                top: chartMargin.top,
                left: chartMargin.left,
            };
        case 'right':
            return {
                top: getVerticalTop(),
                left: chartWidth - chartMargin.right - legendWidth,
            };
        case 'left':
            return {
                top: getVerticalTop(),
                left: chartMargin.left,
            };
        case 'bottom':
        default:
            return {
                top: chartHeight - chartMargin.bottom - legendHeight,
                left: chartMargin.left,
            };
    }
}

function getDefaultDiscreteLegendWidth(args: {
    availableWidth: number;
    position: PreparedLegend['position'];
    margin: number;
}): number {
    const {availableWidth, position, margin} = args;

    if (position === 'left' || position === 'right') {
        return Math.max(0, (availableWidth - margin) / 2);
    }

    return availableWidth;
}

function getMaxLegendHeight(args: {
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    preparedLegend: PreparedLegend;
    isVerticalPosition: boolean;
}): number {
    const {chartHeight, chartMargin, preparedLegend, isVerticalPosition} = args;

    if (isVerticalPosition) {
        return chartHeight - chartMargin.top - chartMargin.bottom;
    }

    return (chartHeight - chartMargin.top - chartMargin.bottom - preparedLegend.margin) / 2;
}

/** Complete legend layout without mutating the options used during series preparation. */
export async function finalizePreparedLegend(args: {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    series: PreparedSeries[];
    preparedLegend: PreparedLegend;
}) {
    const {chartWidth, chartHeight, chartMargin, series, preparedLegend} = args;

    const isVerticalPosition =
        preparedLegend.position === 'right' || preparedLegend.position === 'left';
    const maxLegendWidth =
        preparedLegend.type === 'discrete' || isVerticalPosition
            ? preparedLegend.resolvedWidth
            : preparedLegend.availableWidth;
    const maxLegendHeight = Math.max(
        0,
        getMaxLegendHeight({
            chartHeight,
            chartMargin,
            preparedLegend,
            isVerticalPosition,
        }),
    );
    const flattenLegendItems = getFlattenLegendItems(series, preparedLegend);
    const symbolMetrics = {
        width: Math.max(0, ...flattenLegendItems.map(({symbol}) => symbol.bboxWidth)),
        padding: Math.max(0, ...flattenLegendItems.map(({symbol}) => symbol.padding)),
    };
    const items = await getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
        symbolMetrics,
    });

    let pagination: LegendConfig['pagination'] | undefined;
    let rows: PreparedLegendRow[] = [];
    let legendHeight = preparedLegend.height;

    if (preparedLegend.type === 'discrete') {
        rows = getLegendRows(items, preparedLegend, maxLegendWidth, symbolMetrics);
        legendHeight = rows.reduce((acc, row) => acc + row.height, 0);

        if (maxLegendHeight < legendHeight) {
            const lines = Math.floor(maxLegendHeight / preparedLegend.lineHeight);
            legendHeight = preparedLegend.lineHeight * lines;
            pagination = getPagination({
                rows,
                maxLegendHeight: legendHeight,
                paginatorHeight: preparedLegend.lineHeight,
            });
        }
    }

    const offset = getLegendOffset({
        position: preparedLegend.position,
        verticalAlign: preparedLegend.verticalAlign,
        chartWidth,
        chartHeight,
        chartMargin,
        legendWidth: preparedLegend.resolvedWidth,
        legendHeight,
    });

    if (preparedLegend.type === 'discrete' && !isVerticalPosition) {
        const remainingWidth = preparedLegend.availableWidth - maxLegendWidth;
        if (preparedLegend.align === 'right') {
            offset.left += remainingWidth;
        } else if (preparedLegend.align === 'center') {
            offset.left += remainingWidth / 2;
        }
    }

    return {
        preparedLegend: {...preparedLegend, rows, height: legendHeight},
        legendConfig: {
            offset,
            pagination,
            maxWidth: maxLegendWidth,
            height: legendHeight,
            width: preparedLegend.resolvedWidth,
        },
        legendItems: items,
    };
}
