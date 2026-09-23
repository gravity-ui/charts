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
} from '../utils';

import type {LegendItem, PreparedLegend, PreparedLegendSymbol, PreparedSeries} from './types';

type LegendItemWithoutTextWidth = Omit<LegendItem, 'textWidth'>;

interface LegendSymbolMetrics {
    width: number;
    padding: number;
}

export async function getPreparedLegend(args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
}): Promise<PreparedLegend> {
    const {legend, series} = args;
    const seriesWithEnabledLegend = series.filter((s) => s.legend?.enabled !== false);
    const enabled = Boolean(
        typeof legend?.enabled === 'boolean' ? legend?.enabled : seriesWithEnabledLegend.length > 1,
    );
    const defaultItemStyle = clone(legendDefaults.itemStyle);
    const itemStyle = get(legend, 'itemStyle');
    const computedItemStyle = merge(defaultItemStyle, itemStyle);
    const {
        width: lineWidth,
        height: lineHeight,
        hangingOffset: itemHangingOffset,
    } = await getTextSizeFn({style: computedItemStyle})('Tmp');
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
            legendWidth = get(legend, 'width', CONTINUOUS_LEGEND_SIZE.width);
            height += CONTINUOUS_LEGEND_SIZE.height;
            height += ticks.labelsLineHeight + ticks.labelsMargin;

            colorScale.colors = legend?.colorScale?.colors ?? [];
            colorScale.stops =
                legend?.colorScale?.stops ?? getDefaultColorStops(colorScale.colors.length);
            colorScale.domain =
                legend?.colorScale?.domain ?? getDomainForContinuousColorScale({series});
        } else {
            height += lineHeight;
            legendWidth = get(legend, 'width', lineWidth);
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
        margin: get(legend, 'margin', legendDefaults.margin),
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
        width: legend?.width,
        resolvedWidth: legendWidth,
        ticks,
        colorScale,
        html: get(legend, 'html', false),
        position: get(legend, 'position', 'bottom'),
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
    let textWidthsInLine: number[] = [0];
    let lineIndex = 0;

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

        textWidthsInLine.push(resultItem.textWidth);
        const textsWidth = textWidthsInLine.reduce((acc, width) => acc + width, 0);

        if (!result[lineIndex]) {
            result[lineIndex] = [];
        }

        result[lineIndex].push(resultItem);
        const symbolsWidth = result[lineIndex].reduce((acc, {symbol}) => {
            return acc + symbol.bboxWidth + symbol.padding;
        }, 0);
        const distancesWidth = (result[lineIndex].length - 1) * preparedLegend.itemDistance;
        const isOverflowedAsOnlyItemInLine =
            resultItem.overflowed && result[lineIndex].length === 1;
        const isCurrentLineOverMaxWidth =
            maxLegendWidth < textsWidth + symbolsWidth + distancesWidth;

        if (isOverflowedAsOnlyItemInLine) {
            lineIndex += 1;
            textWidthsInLine = [];
        } else if (isCurrentLineOverMaxWidth && result[lineIndex].length > 1) {
            result[lineIndex].pop();
            lineIndex += 1;
            textWidthsInLine = [resultItem.textWidth];
            const nextLineIndex = lineIndex;
            result[nextLineIndex] = [];
            result[nextLineIndex].push(resultItem);
        }
    }

    return result;
}

function getPagination(args: {
    rows: PreparedLegend['rows'];
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
) {
    const vertical = legend.layout === 'vertical';
    const flatItems = items.flat();
    const {width: symbolWidth, padding: symbolPadding} = symbolMetrics;
    const listWidth =
        symbolWidth + symbolPadding + Math.max(0, ...flatItems.map((item) => item.textWidth));
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

function getMaxLegendWidth(args: {
    chartWidth: number;
    chartMargin: PreparedChart['margin'];
    preparedLegend: PreparedLegend;
    isVerticalPosition: boolean;
}): number {
    const {chartWidth, chartMargin, preparedLegend, isVerticalPosition} = args;
    const availableWidth = Math.max(0, chartWidth - chartMargin.right - chartMargin.left);

    if (preparedLegend.type === 'discrete' && preparedLegend.width !== undefined) {
        return Math.max(0, Math.min(preparedLegend.width, availableWidth));
    }

    if (isVerticalPosition) {
        return Math.max(0, (availableWidth - preparedLegend.margin) / 2);
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

export async function getLegendComponents(args: {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    series: PreparedSeries[];
    preparedLegend: PreparedLegend;
}) {
    const {chartWidth, chartHeight, chartMargin, series, preparedLegend} = args;

    const isVerticalPosition =
        preparedLegend.position === 'right' || preparedLegend.position === 'left';
    const maxLegendWidth = getMaxLegendWidth({
        chartWidth,
        chartMargin,
        preparedLegend,
        isVerticalPosition,
    });
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

    if (preparedLegend.type === 'discrete') {
        const rows = getLegendRows(items, preparedLegend, maxLegendWidth, symbolMetrics);
        preparedLegend.rows = rows;
        let legendHeight = rows.reduce((acc, row) => acc + row.height, 0);

        if (maxLegendHeight < legendHeight) {
            const lines = Math.floor(maxLegendHeight / preparedLegend.lineHeight);
            legendHeight = preparedLegend.lineHeight * lines;
            pagination = getPagination({
                rows,
                maxLegendHeight: legendHeight,
                paginatorHeight: preparedLegend.lineHeight,
            });
        }

        preparedLegend.height = legendHeight;
        preparedLegend.resolvedWidth = maxLegendWidth;
    }

    const offset = getLegendOffset({
        position: preparedLegend.position,
        verticalAlign: preparedLegend.verticalAlign,
        chartWidth,
        chartHeight,
        chartMargin,
        legendWidth: preparedLegend.resolvedWidth,
        legendHeight: preparedLegend.height,
    });

    if (preparedLegend.type === 'discrete' && !isVerticalPosition) {
        const remainingWidth = chartWidth - chartMargin.left - chartMargin.right - maxLegendWidth;
        if (preparedLegend.align === 'right') {
            offset.left += remainingWidth;
        } else if (preparedLegend.align === 'center') {
            offset.left += remainingWidth / 2;
        }
    }

    return {
        legendConfig: {
            offset,
            pagination,
            maxWidth: maxLegendWidth,
            height: preparedLegend.height,
            width: preparedLegend.resolvedWidth,
        },
        legendItems: items,
    };
}
