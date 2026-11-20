import {isValueInAxisRange} from '~core/series/domain-points';
import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipYValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {getFormattedValue} from '~core/utils/format';
import {filterPoints} from '~core/zoom/filter-data';

import type {XRangeSeries, XRangeSeriesData} from '../../types';

import {xRangeDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {XRangeInteractionItem} from './interaction-types';
import {prepareXRangeData} from './prepare-data';
import {prepareXRangeSeries} from './prepare-x-range-series';
import type {PreparedXRangeSeries} from './prepared-series';
import {renderXRange} from './renderer';
import type {PreparedXRangeData, XRangeTooltipChunk} from './types';

async function prepareLayer(
    args: PrepareLayerArgs<PreparedXRangeSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareLayerResult<PreparedXRangeData, PreparedXRangeData>> {
    const {series, xAxis, xScale, yAxis, yScale, boundsWidth, isRangeSlider} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], lookupItems: []};
    }

    const data = await prepareXRangeData({
        series: series,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsWidth,
        isRangeSlider,
    });

    return {
        renderData: data,
        htmlLabels: data.flatMap((item) => item.htmlLabels),
        labelLayout: data,
        lookupItems: data,
    };
}

function renderLayer({
    plot,
    labelsPlot,
    renderData,
    seriesOptions,
    dispatcher,
}: RenderLayerArgs<PreparedXRangeData, PreparedSeriesOptions>) {
    return renderXRange({plot, labelsPlot}, renderData, seriesOptions, dispatcher);
}

function getXRangeWidth(data: XRangeSeriesData) {
    return Math.abs(Number(data.x1) - Number(data.x0));
}

export const xRangePlugin = {
    type: 'x-range',
    series: {
        optionsDefaults: xRangeDefaults,
        prepare: prepareXRangeSeries,
    },
    axes: {
        x: {
            getData: ({series}) => ({
                values: series.flatMap((item) =>
                    item.data.flatMap((point) =>
                        point.x0 !== null && point.x1 !== null ? [point.x0, point.x1] : [],
                    ),
                ),
                domainValues: series.flatMap((item) =>
                    item.data.flatMap((point) => [point.x0, point.x1]),
                ),
            }),
        },
    },
    colorScale: {
        getValue: getXRangeWidth,
    },
    layers: {
        prepareData: prepareLayer,
        render: renderLayer,
    },
    zoom: {
        types: ['x'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {
                isXInRange: (point, axis) =>
                    isValueInAxisRange(point.x0, axis) || isValueInAxisRange(point.x1, axis),
            }),
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: ({item, xAxis}) =>
            xAxis?.type === 'category' ? undefined : getXRangeWidth(item.data),
        header: {getValue: getTooltipYValue, axis: 'y', priority: 1},
        rows: [
            {
                id: 'default',
                cells: [
                    {
                        id: 'color',
                        source: 'color',
                        format: {
                            type: 'custom',
                            formatter: ({value}) => getTooltipColorSymbol({color: String(value)}),
                        },
                        width: '16px',
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {
                        id: 'value',
                        source: ({item}) => {
                            const {data, series} = item;
                            const format = series.tooltip?.valueFormat;
                            const x0 = getFormattedValue({value: data.x0, format}) ?? data.x0;
                            const x1 = getFormattedValue({value: data.x1, format}) ?? data.x1;
                            return `${x0} — ${x1}`;
                        },
                        align: 'end',
                    },
                ],
            },
        ],
    },
} satisfies SeriesPlugin<{
    raw: XRangeSeries;
    prepared: PreparedXRangeSeries;
    shape: PreparedXRangeData;
    options: ChartSeriesOptions;
    tooltipChunk: XRangeTooltipChunk;
    interaction: XRangeInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
