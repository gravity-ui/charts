import {select} from 'd3';
import {groupBy} from 'lodash';
import clone from 'lodash/clone';
import get from 'lodash/get';
import merge from 'lodash/merge';

import {CONTINUOUS_LEGEND_SIZE, legendDefaults} from '../../constants';
import type {BaseTextStyle, ChartData} from '../../types';
import {getDefaultColorStops, getDomainForContinuousColorScale, getLabelsSize} from '../../utils';
import type {PreparedChart} from '../useChartOptions/types';

import type {LegendConfig, LegendItem, PreparedLegend, PreparedSeries} from './types';

type LegendItemWithoutTextWidth = Omit<LegendItem, 'textWidth'>;

export async function getPreparedLegend(args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
}): Promise<PreparedLegend> {
    const {legend, series} = args;
    const enabled = Boolean(
        typeof legend?.enabled === 'boolean' ? legend?.enabled : series.length > 1,
    );
    const defaultItemStyle = clone(legendDefaults.itemStyle);
    const itemStyle = get(legend, 'itemStyle');
    const computedItemStyle = merge(defaultItemStyle, itemStyle);
    const {maxHeight: lineHeight, maxWidth: lineWidth} = await getLabelsSize({
        labels: ['Tmp'],
        style: computedItemStyle,
    });
    const legendType = get(legend, 'type', 'discrete');
    const isTitleEnabled = Boolean(legend?.title?.text);
    const titleMargin = isTitleEnabled ? get(legend, 'title.margin', 4) : 0;
    const titleStyle: BaseTextStyle = {
        fontSize: '12px',
        fontWeight: 'bold',
        ...get(legend, 'title.style'),
    };
    const titleText = isTitleEnabled ? get(legend, 'title.text', '') : '';
    const titleSize = await getLabelsSize({labels: [titleText], style: titleStyle});
    const titleHeight = isTitleEnabled ? titleSize.maxHeight : 0;
    const tickStyle: BaseTextStyle = {
        fontSize: '12px',
    };

    const ticks = {
        labelsMargin: 4,
        labelsLineHeight: (await getLabelsSize({labels: ['Tmp'], style: tickStyle})).maxHeight,
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
        height,
        itemDistance: get(legend, 'itemDistance', legendDefaults.itemDistance),
        itemStyle: computedItemStyle,
        lineHeight,
        margin: get(legend, 'margin', legendDefaults.margin),
        type: legendType,
        title: {
            enable: isTitleEnabled,
            text: titleText,
            margin: titleMargin,
            style: titleStyle,
            height: titleHeight,
            align: get(legend, 'title.align', 'left'),
        },
        width: legendWidth,
        ticks,
        colorScale,
        html: get(legend, 'html', false),
        position: get(legend, 'position', 'bottom'),
    };
}

function getFlattenLegendItems(series: PreparedSeries[], preparedLegend: PreparedLegend) {
    const grouped = groupBy(series, (s) => s.legend.groupId);
    return Object.values(grouped).reduce<LegendItemWithoutTextWidth[]>((acc, items) => {
        const s = items.find((item) => item.legend.enabled);

        if (s) {
            acc.push({
                ...s,
                id: s.legend.groupId,
                name: s.legend.itemText,
                height: preparedLegend.lineHeight,
                symbol: s.legend.symbol,
            });
        }

        return acc;
    }, []);
}

function getGroupedLegendItems(args: {
    maxLegendWidth: number;
    items: LegendItemWithoutTextWidth[];
    preparedLegend: PreparedLegend;
}) {
    const {maxLegendWidth, items, preparedLegend} = args;
    const result: LegendItem[][] = [[]];
    const bodySelection = select(document.body);
    let textWidthsInLine: number[] = [0];
    let lineIndex = 0;

    items.forEach((item) => {
        const itemSelection = preparedLegend.html
            ? bodySelection
                  .append('div')
                  .html(item.name)
                  .style('position', 'absolute')
                  .style('display', 'inline-block')
                  .style('white-space', 'nowrap')
            : bodySelection.append('text').text(item.name).style('white-space', 'nowrap');
        itemSelection
            .style('font-size', preparedLegend.itemStyle.fontSize)
            .each(function () {
                const resultItem = clone(item) as LegendItem;
                const {height, width: textWidth} = this.getBoundingClientRect();
                resultItem.height = height;

                if (
                    textWidth >
                    maxLegendWidth - resultItem.symbol.width - resultItem.symbol.padding
                ) {
                    resultItem.overflowed = true;
                    resultItem.textWidth =
                        maxLegendWidth - resultItem.symbol.width - resultItem.symbol.padding;
                } else {
                    resultItem.textWidth = textWidth;
                }

                textWidthsInLine.push(textWidth);
                const textsWidth = textWidthsInLine.reduce((acc, width) => acc + width, 0);

                if (!result[lineIndex]) {
                    result[lineIndex] = [];
                }

                result[lineIndex].push(resultItem);
                const symbolsWidth = result[lineIndex].reduce((acc, {symbol}) => {
                    return acc + symbol.width + symbol.padding;
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
                    textWidthsInLine = [textWidth];
                    const nextLineIndex = lineIndex;
                    result[nextLineIndex] = [];
                    result[nextLineIndex].push(resultItem);
                }
            })
            .remove();
    });

    return result;
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

        if (currentHeight > maxLegendHeight - paginatorHeight) {
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

    if (isVerticalPosition) {
        return (chartWidth - chartMargin.right - chartMargin.left - preparedLegend.margin) / 2;
    }

    return chartWidth - chartMargin.right - chartMargin.left;
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

export function getLegendComponents(args: {
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
    const maxLegendHeight = getMaxLegendHeight({
        chartHeight,
        chartMargin,
        preparedLegend,
        isVerticalPosition,
    });
    const flattenLegendItems = getFlattenLegendItems(series, preparedLegend);
    const items = getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
    });

    let pagination: LegendConfig['pagination'] | undefined;

    if (preparedLegend.type === 'discrete') {
        const lineHeights = items.reduce<number[]>((acc, item) => {
            if (item.length) {
                acc.push(Math.max(...item.map(({height}) => height)));
            }

            return acc;
        }, []);
        let legendHeight = lineHeights.reduce((acc, height) => acc + height, 0);

        if (maxLegendHeight < legendHeight) {
            const lines = Math.floor(maxLegendHeight / preparedLegend.lineHeight);
            legendHeight = preparedLegend.lineHeight * lines;
            pagination = getPagination({
                items,
                maxLegendHeight: legendHeight,
                paginatorHeight: preparedLegend.lineHeight,
            });
        }

        preparedLegend.height = legendHeight;
        preparedLegend.width = Math.max(maxLegendWidth, preparedLegend.width);
    }

    const offset = getLegendOffset({
        position: preparedLegend.position,
        verticalAlign: preparedLegend.verticalAlign,
        chartWidth,
        chartHeight,
        chartMargin,
        legendWidth: preparedLegend.width,
        legendHeight: preparedLegend.height,
    });

    return {legendConfig: {offset, pagination, maxWidth: maxLegendWidth}, legendItems: items};
}
