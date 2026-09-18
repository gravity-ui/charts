import {sort} from 'd3-array';
import get from 'lodash/get';

import {DEFAULT_DATALABELS_STYLE, seriesRangeSliderOptionsDefaults} from '~core/constants';
import {DEFAULT_DATALABELS_PADDING} from '~core/series/constants';
import type {PrepareSeriesArgs} from '~core/series/plugin';
import type {PreparedAreaRangeSeries} from '~core/series/types';
import {prepareLegendSymbol} from '~core/series/utils';
import {getDefaultValueFormat} from '~core/tooltip/utils';
import {getGradientMidColor, getUniqId, isLinearGradient} from '~core/utils';

import type {AreaRangeSeries, AreaRangeSeriesData} from '../../types';

const DEFAULT_LINE_WIDTH = 1;

function prepareSeriesData(
    series: AreaRangeSeries,
    xAxis: PrepareSeriesArgs['xAxis'],
): AreaRangeSeriesData[] {
    if (xAxis?.type === 'category') {
        return series.data;
    }

    return sort(series.data, (d) => Number(d.x));
}

export function prepareAreaRangeSeries(
    args: PrepareSeriesArgs<AreaRangeSeries>,
): PreparedAreaRangeSeries[] {
    const {colorScale, series: seriesList, seriesOptions, legend, xAxis, yAxis} = args;
    const defaultLineWidth = get(seriesOptions, 'area-range.lineWidth', DEFAULT_LINE_WIDTH);

    return seriesList.map<PreparedAreaRangeSeries>((series) => {
        const name = series.name || '';
        const lineColor = series.color || colorScale(name);
        const areaFillColor = series.fillColor || lineColor;
        const gradient = isLinearGradient(lineColor) ? lineColor : undefined;
        const fillGradient = isLinearGradient(areaFillColor) ? areaFillColor : undefined;
        const color = typeof lineColor === 'string' ? lineColor : getGradientMidColor(lineColor);
        const fillColor =
            typeof areaFillColor === 'string' ? areaFillColor : getGradientMidColor(areaFillColor);
        const yAxisIndex = get(series, 'yAxis', 0);

        return {
            type: series.type,
            color,
            name,
            id: getUniqId(),
            visible: get(series, 'visible', true),
            legend: {
                color: fillColor,
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLegendSymbol(series),
                groupId: series.legend?.groupId ?? getUniqId(),
                itemText: series.legend?.itemText ?? name,
            },
            data: prepareSeriesData(series, xAxis),
            opacity: get(series, 'opacity', 0.75),
            lineWidth: get(series, 'lineWidth', defaultLineWidth),
            cursor: get(series, 'cursor', null),
            tooltip: {
                ...series.tooltip,
                valueFormat:
                    series.tooltip?.valueFormat ??
                    getDefaultValueFormat({axis: yAxis?.[yAxisIndex]}),
            },
            dataLabels: {
                enabled: get(series, 'dataLabels.enabled', false),
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, series.dataLabels?.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: series.dataLabels?.format,
            },
            rangeSlider: Object.assign({}, seriesRangeSliderOptionsDefaults, series.rangeSlider),
            nullMode: series.nullMode ?? 'skip',
            gradient,
            fillColor,
            fillGradient,
            yAxis: yAxisIndex,
            custom: series.custom,
        };
    });
}
