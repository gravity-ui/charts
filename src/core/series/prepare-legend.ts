import clone from 'lodash/clone';
import get from 'lodash/get';
import merge from 'lodash/merge';

import type {BaseTextStyle, ChartData, LegendConfig} from '../../types';
import type {PreparedChart} from '../chart/types';
import {CONTINUOUS_LEGEND_SIZE, legendDefaults} from '../constants';
import {getDefaultColorStops, getDomainForContinuousColorScale, getTextSizeFn} from '../utils';

import {limitLegendItemRows, prepareLegendItems} from './legend-label';
import type {LegendItem, PreparedLegend, PreparedSeries} from './types';

type LegendItemWithoutTextWidth = Omit<LegendItem, 'textWidth'>;

export async function getPreparedLegend(args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
}): Promise<PreparedLegend> {
    const {legend, series} = args;
    const itemMaxRowCount = legend?.itemMaxRowCount ?? legendDefaults.itemMaxRowCount;
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
        align: get(legend, 'align', legendDefaults.align),
        verticalAlign: get(legend, 'verticalAlign', legendDefaults.verticalAlign),
        justifyContent: get(legend, 'justifyContent', legendDefaults.justifyContent),
        enabled,
        hangingOffset: itemHangingOffset,
        height,
        itemDistance: get(legend, 'itemDistance', legendDefaults.itemDistance),
        itemMaxRowCount,
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
}) {
    const {maxLegendWidth, items, preparedLegend} = args;
    if (maxLegendWidth <= 0) {
        return [];
    }

    const result: LegendItem[][] = [[]];
    let textWidthsInLine: number[] = [0];
    let lineIndex = 0;

    const preparedItems = await prepareLegendItems({items, maxLegendWidth, legend: preparedLegend});
    for (const resultItem of preparedItems) {
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
        } else if (isCurrentLineOverMaxWidth) {
            result[lineIndex].pop();
            lineIndex += 1;
            textWidthsInLine = [resultItem.textWidth];
            const nextLineIndex = lineIndex;
            result[nextLineIndex] = [];
            result[nextLineIndex].push(resultItem);
        }
    }

    return result.filter((line) => line.length);
}

function getPagination(args: {
    items: LegendItem[][];
    maxLegendHeight: number;
    paginatorHeight: number;
}) {
    const {items, maxLegendHeight, paginatorHeight} = args;
    const pages: NonNullable<LegendConfig['pagination']>['pages'] = [];
    let currentPageIndex = 0;
    let currentHeight = 0;
    items.forEach((item, i) => {
        if (!pages[currentPageIndex]) {
            pages[currentPageIndex] = {start: i, end: i};
        }

        const legendLineHeight = Math.max(...item.map(({height}) => height));
        currentHeight += legendLineHeight;

        if (
            currentHeight > maxLegendHeight - paginatorHeight &&
            pages[currentPageIndex].start < i
        ) {
            pages[currentPageIndex].end = i;
            currentPageIndex += 1;
            currentHeight = legendLineHeight;
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#end
            pages[currentPageIndex] = {start: i, end: i + (i === items.length - 1 ? 1 : 0)};
        } else if (i === items.length - 1) {
            pages[currentPageIndex].end = i + 1;
        }
    });
    return {pages};
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
    let items = await getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
    });

    let pagination: LegendConfig['pagination'] | undefined;

    if (preparedLegend.type === 'discrete') {
        const titleHeight = preparedLegend.title.height + preparedLegend.title.margin;
        const contentHeight = Math.max(0, maxLegendHeight - titleHeight);
        const lineHeights = items.reduce<number[]>((acc, item) => {
            if (item.length) {
                acc.push(Math.max(...item.map(({height}) => height)));
            }

            return acc;
        }, []);
        let legendHeight = lineHeights.reduce((acc, height) => acc + height, 0);

        if (contentHeight < legendHeight) {
            const lines = Math.floor(contentHeight / preparedLegend.lineHeight);
            legendHeight = preparedLegend.lineHeight * lines;
            if (preparedLegend.itemMaxRowCount > 1) {
                const maxRows = Math.max(0, lines - 1);
                if (maxRows === 0) {
                    items = [];
                    legendHeight = 0;
                } else {
                    await limitLegendItemRows(items.flat(), maxRows, preparedLegend);
                }
            }
            pagination = items.length
                ? getPagination({
                      items,
                      maxLegendHeight: legendHeight,
                      paginatorHeight: preparedLegend.lineHeight,
                  })
                : undefined;
        }

        preparedLegend.height = legendHeight + titleHeight;
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
