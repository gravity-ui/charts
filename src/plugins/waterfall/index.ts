import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {filterPoints} from '~core/zoom/filter-data';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {WaterfallSeries} from '../../types';
import {validateBarLabelPlacement} from '../bar-label-placement';

import {waterfallDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {WaterfallInteractionItem} from './interaction-types';
import {getWaterfallIntervals, resolveWaterfallIntervals} from './intervals';
import {prepareWaterfallData} from './prepare-data';
import {prepareWaterfallPoints, prepareWaterfallSeries} from './prepare-waterfall-series';
import type {PreparedWaterfallSeries} from './prepared-series';
import {renderWaterfall} from './renderer';
import type {PreparedWaterfallData, WaterfallTooltipChunk} from './types';

import './styles.scss';

function isPreparedWaterfallSeries(
    series: WaterfallSeries | PreparedWaterfallSeries,
): series is PreparedWaterfallSeries {
    return 'fullData' in series;
}

async function prepareLayer(
    args: PrepareLayerArgs<PreparedWaterfallSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareLayerResult<PreparedWaterfallData, PreparedWaterfallData>> {
    const {series, seriesOptions, boundsWidth, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], lookupItems: []};
    }

    const intervals = getWaterfallIntervals(series);

    const data = await prepareWaterfallData({
        series,
        intervals,
        seriesOptions,
        boundsWidth,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
    });

    return {renderData: data, lookupItems: data};
}

export const waterfallPlugin = {
    type: 'waterfall',
    series: {
        optionsDefaults: waterfallDefaults,
        validate: ({series}) => {
            validateBarLabelPlacement(series.dataLabels);
            const {connectors} = series;
            if (connectors === undefined) {
                return;
            }

            if (
                typeof connectors !== 'object' ||
                connectors === null ||
                Array.isArray(connectors)
            ) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: 'waterfall.connectors must be an object',
                });
            }

            if (connectors.enabled !== undefined && typeof connectors.enabled !== 'boolean') {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: 'waterfall.connectors.enabled must be a boolean',
                });
            }
        },
        prepare: prepareWaterfallSeries,
    },
    axes: {
        y: {
            baseline: 0,
            getData: ({series}) => {
                const intervals = getWaterfallIntervals(series.filter(isPreparedWaterfallSeries));
                const values: number[] = [];
                for (const item of series) {
                    const prepared = isPreparedWaterfallSeries(item);
                    const points = prepared ? item.data : prepareWaterfallPoints(item);
                    const itemIntervals = prepared ? intervals : resolveWaterfallIntervals(points);
                    for (const point of points) {
                        const interval = itemIntervals.get(point);
                        if (interval) values.push(interval.start, interval.end);
                    }
                }
                return {domainValues: values};
            },
        },
    },
    colorScale: {
        getValue: (d) => d.y,
    },
    layers: {
        prepareData: prepareLayer,
        render: function ({
            plot,
            labelsPlot,
            renderData,
            seriesOptions,
            dispatcher,
        }: RenderLayerArgs<PreparedWaterfallData, PreparedSeriesOptions>) {
            const allowOverlap = renderData.some((d) => d.series.dataLabels.allowOverlap);
            return renderWaterfall(
                {plot, labelsPlot},
                renderData,
                seriesOptions,
                allowOverlap,
                dispatcher,
            );
        },
    },
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: ({series, viewport, seriesGroup}) => {
            const yRange = viewport.y.range;
            if (!yRange) return filterPoints(series.data, viewport);

            const intervals = getWaterfallIntervals(seriesGroup ?? [series]);
            const [min, max] = yRange;
            return filterPoints(series.data, viewport, {
                isYInRange: (point) => {
                    const interval = intervals.get(point);
                    return Boolean(
                        interval &&
                        min <= max &&
                        Math.min(interval.start, interval.end) <= max &&
                        Math.max(interval.start, interval.end) >= min,
                    );
                },
            });
        },
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipYValue,
        header: {getValue: getTooltipXValue, axis: 'x'},
        rows: (chunk) => {
            if (chunk.data.total) {
                return [
                    {
                        id: 'totals',
                        cells: [
                            {
                                id: 'name',
                                source: () => 'Total',
                                align: 'start',
                            },
                            {
                                id: 'value',
                                source: 'subTotal',
                                align: 'end',
                            },
                        ],
                    },
                ];
            }

            return [
                {
                    id: 'default',
                    cells: [
                        {
                            id: 'name',
                            source: 'series.name',
                            align: 'start',
                        },
                        {
                            id: 'value',
                            source: 'data.y',
                            align: 'end',
                        },
                    ],
                },
                {
                    id: 'subtotal',
                    cells: [
                        {
                            id: 'name',
                            source: () => 'Subtotal',
                            align: 'start',
                        },
                        {
                            id: 'value',
                            source: 'subTotal',
                            align: 'end',
                        },
                    ],
                },
            ];
        },
    },
} satisfies SeriesPlugin<{
    raw: WaterfallSeries;
    prepared: PreparedWaterfallSeries;
    shape: PreparedWaterfallData;
    options: ChartSeriesOptions;
    tooltipChunk: WaterfallTooltipChunk;
    interaction: WaterfallInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
