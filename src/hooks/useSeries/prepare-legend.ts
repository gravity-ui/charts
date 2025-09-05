import {select} from 'd3';
import clone from 'lodash/clone';
import get from 'lodash/get';
import merge from 'lodash/merge';

import {CONTINUOUS_LEGEND_SIZE, legendDefaults} from '../../constants';
import type {BaseTextStyle, ChartData} from '../../types';
import {
    getDefaultColorStops,
    getDomainForContinuousColorScale,
    getHorisontalSvgTextHeight,
    getLabelsSize,
} from '../../utils';
import {getBoundsWidth} from '../useChartDimensions';
import {getYAxisWidth} from '../useChartDimensions/utils';
import type {PreparedAxis, PreparedChart} from '../useChartOptions/types';

import type {LegendConfig, LegendItem, PreparedLegend, PreparedSeries} from './types';

type LegendItemWithoutTextWidth = Omit<LegendItem, 'textWidth'>;

export function getPreparedLegend(args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
}): PreparedLegend {
    const {legend, series} = args;
    const enabled = Boolean(
        typeof legend?.enabled === 'boolean' ? legend?.enabled : series.length > 1,
    );
    const defaultItemStyle = clone(legendDefaults.itemStyle);
    const itemStyle = get(legend, 'itemStyle');
    const computedItemStyle = merge(defaultItemStyle, itemStyle);
    const lineHeight = getHorisontalSvgTextHeight({text: 'Tmp', style: computedItemStyle});

    const legendType = get(legend, 'type', 'discrete');
    const isTitleEnabled = Boolean(legend?.title?.text);
    const titleMargin = isTitleEnabled ? get(legend, 'title.margin', 4) : 0;
    const titleStyle: BaseTextStyle = {
        fontSize: '12px',
        fontWeight: 'bold',
        ...get(legend, 'title.style'),
    };
    const titleText = isTitleEnabled ? get(legend, 'title.text', '') : '';
    const titleHeight = isTitleEnabled
        ? getLabelsSize({labels: [titleText], style: titleStyle}).maxHeight
        : 0;

    const ticks = {
        labelsMargin: 4,
        labelsLineHeight: 12,
    };

    const colorScale: PreparedLegend['colorScale'] = {
        colors: [],
        domain: [],
        stops: [],
    };

    let height = 0;
    if (enabled) {
        height += titleHeight + titleMargin;
        if (legendType === 'continuous') {
            height += CONTINUOUS_LEGEND_SIZE.height;
            height += ticks.labelsLineHeight + ticks.labelsMargin;

            colorScale.colors = legend?.colorScale?.colors ?? [];
            colorScale.stops =
                legend?.colorScale?.stops ?? getDefaultColorStops(colorScale.colors.length);
            colorScale.domain =
                legend?.colorScale?.domain ?? getDomainForContinuousColorScale({series});
        } else {
            height += lineHeight;
        }
    }

    const legendWidth = get(legend, 'width', CONTINUOUS_LEGEND_SIZE.width);

    return {
        align: get(legend, 'align', legendDefaults.align),
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
    };
}

function getFlattenLegendItems(series: PreparedSeries[], preparedLegend: PreparedLegend) {
    return series.reduce<LegendItemWithoutTextWidth[]>((acc, s) => {
        const legendEnabled = get(s, 'legend.enabled', true);

        if (legendEnabled) {
            acc.push({
                ...s,
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

        const legendLineHeight = Math.max(...item.map((item) => item.height));
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

export function getLegendComponents(args: {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    series: PreparedSeries[];
    preparedLegend: PreparedLegend;
    preparedYAxis: PreparedAxis[];
}) {
    const {chartWidth, chartHeight, chartMargin, series, preparedLegend, preparedYAxis} = args;
    const maxLegendWidth = getBoundsWidth({chartWidth, chartMargin, preparedYAxis});
    const maxLegendHeight =
        (chartHeight - chartMargin.top - chartMargin.bottom - preparedLegend.margin) / 2;
    const flattenLegendItems = getFlattenLegendItems(series, preparedLegend);
    const items = getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
    });

    let pagination: LegendConfig['pagination'] | undefined;

    if (preparedLegend.type === 'discrete') {
        const lineHeights = items.reduce<number[]>((acc, item) => {
            acc.push(Math.max(...item.map((item) => item.height)));
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
    }

    const top = chartHeight - chartMargin.bottom - preparedLegend.height;
    const offset: LegendConfig['offset'] = {
        left: chartMargin.left + getYAxisWidth(preparedYAxis[0]),
        top,
    };

    return {legendConfig: {offset, pagination}, legendItems: items};
}
