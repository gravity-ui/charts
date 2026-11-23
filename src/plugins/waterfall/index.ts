import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedWaterfallSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/waterfall/get-tooltip-data';
import {prepareWaterfallData} from '~core/shapes/waterfall/prepare-data';
import {renderWaterfall} from '~core/shapes/waterfall/renderer';
import type {PreparedWaterfallData} from '~core/shapes/waterfall/types';
import {getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import {filterOverlappingLabels} from '~core/utils';
import {filterPoints} from '~core/zoom/filter-data';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {TooltipDataChunkWaterfall, WaterfallSeries} from '../../types';

import {getTargetElements, prepareNearestData} from './interaction';
import {getWaterfallIntervals, resolveWaterfallIntervals} from './intervals';
import {prepareWaterfallPoints, prepareWaterfallSeries} from './prepare-waterfall-series';

function isPreparedWaterfallSeries(
    series: WaterfallSeries | PreparedWaterfallSeries,
): series is PreparedWaterfallSeries {
    return 'fullData' in series;
}

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const waterfallSeries = series as PreparedWaterfallSeries[];
    const intervals = getWaterfallIntervals(waterfallSeries);

    const data = await prepareWaterfallData({
        series: waterfallSeries,
        intervals,
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
    });

    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    if (!allowOverlap) {
        const filtered = filterOverlappingLabels(data.flatMap((d) => d.htmlLabels));
        const [first, ...rest] = data;
        if (first) {
            const filteredData = [
                {...first, htmlLabels: filtered},
                ...rest.map((d) => ({...d, htmlLabels: [] as typeof d.htmlLabels})),
            ];
            return {renderData: filteredData, tooltipItems: filteredData};
        }
    }

    return {renderData: data, tooltipItems: data};
}

export const waterfallPlugin: SeriesPlugin<WaterfallSeries> = {
    type: 'waterfall',
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
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: ({series, viewport, seriesGroup}) => {
            const waterfallSeries = series as PreparedWaterfallSeries;
            const yRange = viewport.y.range;
            if (!yRange) return filterPoints(waterfallSeries.data, viewport);

            const group = seriesGroup as readonly PreparedWaterfallSeries[] | undefined;
            const intervals = getWaterfallIntervals(group ?? [waterfallSeries]);
            const [min, max] = yRange;
            return filterPoints(waterfallSeries.data, viewport, {
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
    prepareSeries: prepareWaterfallSeries,
    validate: ({series}) => {
        const {connectors} = series;
        if (connectors === undefined) {
            return;
        }

        if (typeof connectors !== 'object' || connectors === null || Array.isArray(connectors)) {
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
    getColorValue: (d) => d.y,
    prepareShapeData,
    renderShapes: function ({
        plot,
        labelsPlot,
        preparedData,
        seriesOptions,
        dispatcher,
    }: RenderShapesArgs) {
        const data = preparedData as PreparedWaterfallData[];
        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        return renderWaterfall({plot, labelsPlot}, data, seriesOptions, allowOverlap, dispatcher);
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
            const c = chunk as TooltipDataChunkWaterfall;
            if (c.data.total) {
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
};
