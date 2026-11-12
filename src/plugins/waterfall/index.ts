import sortBy from 'es-toolkit/compat/sortBy';

import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {filterOverlappingLabels} from '~core/utils';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {WaterfallSeries} from '../../types';

import {waterfallDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {WaterfallInteractionItem} from './interaction-types';
import {prepareWaterfallData} from './prepare-data';
import {prepareWaterfallSeries} from './prepare-waterfall-series';
import type {PreparedWaterfallSeries} from './prepared-series';
import {renderWaterfall} from './renderer';
import type {PreparedWaterfallData, WaterfallTooltipChunk} from './types';

import './styles.scss';

async function prepareShapeData(
    args: PrepareShapeDataArgs<PreparedWaterfallSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareShapeDataResult<PreparedWaterfallData, PreparedWaterfallData>> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareWaterfallData({
        series: series,
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
            return {
                renderData: filteredData,
                htmlLabels: filteredData.flatMap((item) => item.htmlLabels),
                layoutData: filteredData,
                tooltipItems: filteredData,
            };
        }
    }

    return {
        renderData: data,
        htmlLabels: data.flatMap((item) => item.htmlLabels),
        layoutData: data,
        tooltipItems: data,
    };
}

export const waterfallPlugin = {
    type: 'waterfall',
    defaults: waterfallDefaults,
    axes: {
        y: {
            baseline: 0,
            getData: ({series}) => {
                // Preparation splits signs/totals into separate series; restore source point order.
                const points = series.flatMap((item) => item.data);
                const ordered = sortBy(points, (point) =>
                    'index' in point ? point.index : undefined,
                );
                const values: number[] = [];
                let total = 0;
                for (const point of ordered) {
                    if (!point.total) {
                        total += Number(point.y) || 0;
                        values.push(total);
                    }
                }
                return {domainValues: values};
            },
        },
    },
    zoom: {types: ['x', 'xy', 'y'], defaultType: 'x'},
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
    }: RenderShapesArgs<PreparedWaterfallData, PreparedSeriesOptions>) {
        const data = preparedData;
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
            const c = chunk;
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
