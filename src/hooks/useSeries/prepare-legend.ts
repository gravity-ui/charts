import type {Selection} from 'd3';
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

export const getPreparedLegend = (args: {
    legend: ChartData['legend'];
    series: ChartData['series']['data'];
}): PreparedLegend => {
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
};

const getFlattenLegendItems = (series: PreparedSeries[]) => {
    return series.reduce<LegendItemWithoutTextWidth[]>((acc, s) => {
        const legendEnabled = get(s, 'legend.enabled', true);

        if (legendEnabled) {
            acc.push({
                ...s,
                symbol: s.legend.symbol,
            });
        }

        return acc;
    }, []);
};

const getGroupedLegendItems = (args: {
    maxLegendWidth: number;
    items: LegendItemWithoutTextWidth[];
    preparedLegend: PreparedLegend;
}) => {
    const {maxLegendWidth, items, preparedLegend} = args;
    const result: LegendItem[][] = [[]];
    let textWidthsInLine: number[] = [0];
    let lineIndex = 0;

    items.forEach((item) => {
        let text:
            | Selection<HTMLDivElement, unknown, null, undefined>
            | Selection<SVGTextElement, unknown, null, undefined>;
        if (preparedLegend.html) {
            text = select(document.body)
                .append('div')
                .style('position', 'absolute')
                .style('display', 'inline-block')
                .style('font-size', preparedLegend.itemStyle.fontSize)
                [preparedLegend.html ? 'html' : 'text'](item.name) as Selection<
                HTMLDivElement,
                unknown,
                null,
                undefined
            >;
        } else {
            text = select(document.body)
                .append('text')
                .text(item.name)
                .style('font-size', preparedLegend.itemStyle.fontSize);
        }
        text.each(function () {
            const resultItem = clone(item) as LegendItem;
            const textWidth = this.getBoundingClientRect().width;
            resultItem.textWidth = textWidth;
            textWidthsInLine.push(textWidth);
            const textsWidth = textWidthsInLine.reduce((acc, width) => acc + width, 0);
            result[lineIndex].push(resultItem);
            const symbolsWidth = result[lineIndex].reduce((acc, {symbol}) => {
                return acc + symbol.width + symbol.padding;
            }, 0);
            const distancesWidth = (result[lineIndex].length - 1) * preparedLegend.itemDistance;
            const isOverfilled = maxLegendWidth < textsWidth + symbolsWidth + distancesWidth;

            if (isOverfilled) {
                result[lineIndex].pop();
                lineIndex += 1;
                textWidthsInLine = [textWidth];
                const nextLineIndex = lineIndex;
                result[nextLineIndex] = [];
                result[nextLineIndex].push(resultItem);
            }
        }).remove();
    });

    return result;
};

export const getLegendComponents = (args: {
    chartWidth: number;
    chartHeight: number;
    chartMargin: PreparedChart['margin'];
    series: PreparedSeries[];
    preparedLegend: PreparedLegend;
    preparedYAxis: PreparedAxis[];
}) => {
    const {chartWidth, chartHeight, chartMargin, series, preparedLegend, preparedYAxis} = args;
    const maxLegendWidth = getBoundsWidth({chartWidth, chartMargin, preparedYAxis});
    const maxLegendHeight =
        (chartHeight - chartMargin.top - chartMargin.bottom - preparedLegend.margin) / 2;
    const flattenLegendItems = getFlattenLegendItems(series);
    const items = getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
    });

    let pagination: LegendConfig['pagination'] | undefined;

    if (preparedLegend.type === 'discrete') {
        let legendHeight = preparedLegend.lineHeight * items.length;

        if (maxLegendHeight < legendHeight) {
            // extra line for paginator
            const limit = Math.floor(maxLegendHeight / preparedLegend.lineHeight) - 1;
            const maxPage = Math.ceil(items.length / limit);
            pagination = {limit, maxPage};
            legendHeight = maxLegendHeight;
        }

        preparedLegend.height = legendHeight;
    }

    const top = chartHeight - chartMargin.bottom - preparedLegend.height;
    const offset: LegendConfig['offset'] = {
        left: chartMargin.left + getYAxisWidth(preparedYAxis[0]),
        top,
    };

    return {legendConfig: {offset, pagination}, legendItems: items};
};
