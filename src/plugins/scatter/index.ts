import {DEFAULT_AXIS_TYPE} from '~core/constants';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {calculateNumericProperty} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';
import {validateAxisPlotValues, validateXYSeries} from '~core/validation/helpers';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {ScatterClusterData, ScatterSeries, TooltipDataChunk} from '../../types';

import {getScatterAxisPadding} from './axis-padding';
import {scatterDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {ScatterInteractionItem} from './interaction-types';
import {prepareScatterData} from './prepare-data';
import {prepareScatterSeries} from './prepare-scatter-series';
import type {PreparedScatterSeries} from './prepared-series';
import {renderScatter} from './renderer';
import type {PreparedScatterData, PreparedScatterShapeData, ScatterTooltipChunk} from './types';

import './styles.scss';

async function prepareShapeData(
    args: PrepareShapeDataArgs<PreparedScatterSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareShapeDataResult<PreparedScatterShapeData, PreparedScatterData>> {
    const {
        series,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        boundsWidth,
        boundsHeight,
        isOutsideBounds,
        isRangeSlider,
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareScatterData({
        series: series,
        seriesOptions: args.seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        split,
        boundsWidth,
        boundsHeight,
        isOutsideBounds: isOutsideBounds ?? (() => false),
        isRangeSlider,
    });

    return {
        renderData: [data],
        htmlLabels: data.htmlLabels,
        layoutData: [data],
        tooltipItems: data.scatterData,
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs<PreparedScatterShapeData, PreparedSeriesOptions>) {
    return renderScatter({plot, labelsPlot}, preparedData[0], seriesOptions, dispatcher);
}

export const scatterPlugin = {
    type: 'scatter',
    defaults: scatterDefaults,
    axes: {x: {singleValueDomain: 'center'}, y: {singleValueDomain: 'center'}},
    axisPadding: {getPaintExtents: getScatterAxisPadding},
    getClipPath: ({isRangeSlider}) => (isRangeSlider ? 'bounds' : false),
    zoom: {types: ['x', 'xy', 'y'], defaultType: 'xy'},
    prepareSeries: prepareScatterSeries,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({series, xAxis, yAxis});
        validateXYSeries({series, xAxis, yAxis});
        if (!series.cluster?.enabled) {
            return;
        }

        const xType = xAxis?.type ?? DEFAULT_AXIS_TYPE;
        const yType = yAxis?.[series.yAxis ?? 0]?.type ?? DEFAULT_AXIS_TYPE;
        if ((xType !== 'linear' && xType !== 'datetime') || yType !== 'linear') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'Scatter clustering supports linear X/Y and datetime X with linear Y',
            });
        }

        const {layoutAlgorithm, overlapMode, minimumClusterSize, marker} = series.cluster;
        if (layoutAlgorithm?.type !== undefined && layoutAlgorithm.type !== 'grid') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'Scatter clustering supports only the grid layout algorithm',
            });
        }
        const size = calculateNumericProperty({
            value: layoutAlgorithm?.gridSize ?? 50,
            base: 100,
        });
        if (!Number.isFinite(size) || !size || size <= 0) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'Scatter cluster gridSize must be a positive pixel or percentage value',
            });
        }
        if (overlapMode !== undefined && overlapMode !== 'allow' && overlapMode !== 'shift') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'Scatter cluster overlapMode must be allow or shift',
            });
        }
        if (
            minimumClusterSize !== undefined &&
            (!Number.isInteger(minimumClusterSize) || minimumClusterSize < 2)
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'Scatter cluster minimumClusterSize must be an integer of at least 2',
            });
        }
        if (
            (marker?.radius !== undefined &&
                (!Number.isFinite(marker.radius) || marker.radius <= 0)) ||
            (marker?.borderWidth !== undefined &&
                (!Number.isFinite(marker.borderWidth) || marker.borderWidth < 0))
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message:
                    'Scatter cluster marker radius must be positive and borderWidth nonnegative',
            });
        }
    },
    getColorValue: (d) => d.y,
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: (args) => {
            const data = args.item.data as ScatterClusterData;
            return data.cluster?.size ?? getTooltipYValue(args);
        },
        header: {getValue: getTooltipXValue, axis: 'x'},
        rows: (item: TooltipDataChunk) => {
            const cluster = (item.data as ScatterClusterData).cluster;
            return [
                {
                    id: 'default',
                    cells: [
                        {
                            id: 'color',
                            source: 'color',
                            format: {
                                type: 'custom',
                                formatter: ({value}) =>
                                    getTooltipColorSymbol({color: String(value)}),
                            },
                            width: '16px',
                        },
                        {id: 'name', source: 'name', align: 'start'},
                        cluster
                            ? {
                                  id: 'value',
                                  source: 'data.cluster.size',
                                  align: 'end',
                                  formatValue: ({value}) =>
                                      getFormattedValue({
                                          value: value as number,
                                          format: {type: 'number', precision: 0},
                                      }),
                              }
                            : {id: 'value', source: 'data.y', align: 'end'},
                    ],
                },
            ];
        },
    },
} satisfies SeriesPlugin<{
    raw: ScatterSeries;
    prepared: PreparedScatterSeries;
    shape: PreparedScatterShapeData;
    options: ChartSeriesOptions;
    tooltipChunk: ScatterTooltipChunk;
    interaction: ScatterInteractionItem;
    tooltipItem: PreparedScatterData;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
