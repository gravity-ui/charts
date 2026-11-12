import {i18n} from '~core/i18n';
import type {DomainAxis} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipXValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {filterLayerLabels} from '~core/utils';
import {createGradientGeometryPreparer, getGradientGeometry} from '~core/utils/gradient-geometry';
import {
    validateAxisPlotValues,
    validateSeriesColor,
    validateXYSeries,
} from '~core/validation/helpers';
import {filterPoints} from '~core/zoom/filter-data';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaRangeSeries, AreaRangeSeriesData} from '../../types';

import {getAreaRangeAxisPadding} from './axis-padding';
import {areaRangeDefaults} from './defaults';
import {formatAreaRange, getAreaRangeWidth} from './format';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {AreaRangeInteractionItem} from './interaction-types';
import {prepareAreaRangeSeries} from './prepare-area-range-series';
import {prepareAreaRangeData, projectAreaRangeData} from './prepare-data';
import type {PreparedAreaRangeSeries} from './prepared-series';
import {renderAreaRange} from './renderer';
import type {AreaRangeTooltipChunk, PreparedAreaRangeData} from './types';

function isAreaRangePointDefined(point: AreaRangeSeriesData) {
    return point.y0 !== null && point.y1 !== null;
}

function isAreaRangePointInYRange({y0, y1}: AreaRangeSeriesData, {range}: DomainAxis) {
    const [min, max] = range as readonly [number, number];
    return y0 !== null && y1 !== null && y0 <= max && y1 >= min;
}

export const areaRangePlugin = {
    type: 'area-range',
    defaults: areaRangeDefaults,
    axes: {
        y: {
            getData: ({series, viewport}) => ({
                domainValues: series.flatMap((item) =>
                    getDomainPoints(item.data, viewport, {
                        isYInRange: isAreaRangePointInYRange,
                    }).flatMap((point) =>
                        point.y0 === null || point.y1 === null ? [] : [point.y0, point.y1],
                    ),
                ),
            }),
        },
    },
    axisPadding: {getPaintExtents: getAreaRangeAxisPadding},
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(
                series.nullMode === 'connect'
                    ? series.data.filter(isAreaRangePointDefined)
                    : series.data,
                viewport,
                {
                    mode: 'path',
                    isDefined: isAreaRangePointDefined,
                    isYInRange: isAreaRangePointInYRange,
                    overlapsYRange: (from, to, {range}) => {
                        const [min, max] = range as readonly [number, number];
                        return (
                            Math.min(from.y0 ?? NaN, to.y0 ?? NaN) <= max &&
                            Math.max(from.y1 ?? NaN, to.y1 ?? NaN) >= min
                        );
                    },
                },
            ),
    },
    prepareGradientGeometry: createGradientGeometryPreparer(projectAreaRangeData),
    prepareSeries: prepareAreaRangeSeries,
    getColorValue: getAreaRangeWidth,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.y0}))},
            xAxis,
            yAxis,
        });
        validateXYSeries({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.y0}))},
            xAxis,
            yAxis,
        });
        validateXYSeries({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.y1}))},
            xAxis,
            yAxis,
        });
        validateSeriesColor({color: series.color, seriesName: series.name});
        validateSeriesColor({color: series.fillColor, seriesName: series.name});

        if (
            series.data.some(
                (data) => data.y0 !== null && data.y1 !== null && Number(data.y0) > Number(data.y1),
            )
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-area-range-bounds', {
                    seriesName: series.name,
                }),
            });
        }
    },
    prepareShapeData: async (
        args: PrepareShapeDataArgs<PreparedAreaRangeSeries, PreparedSeriesOptions, PreparedSeries>,
    ): Promise<PrepareShapeDataResult<PreparedAreaRangeData, PreparedAreaRangeData>> => {
        const {
            series,
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
            otherLayers = [],
        } = args;

        if (!xAxis || !xScale || !yScale?.length || !split) {
            return {renderData: [], tooltipItems: []};
        }

        const data = await prepareAreaRangeData({
            series: series,
            xAxis,
            xScale,
            yAxis: yAxis ?? [],
            yScale,
            split,
            isOutsideBounds: isOutsideBounds ?? (() => false),
            isRangeSlider,
        });
        const filteredData = filterLayerLabels(data, otherLayers);
        return {
            renderData: filteredData,
            markers: filteredData.flatMap((item) => item.markers),
            htmlLabels: filteredData.flatMap((item) => item.htmlLabels),
            getHoverMarkers: (hovered) =>
                filteredData.flatMap((item) => item.getHoverMarkers(hovered)),
            layoutData: filteredData,
            tooltipItems: filteredData,
            gradientGeometry: getGradientGeometry(filteredData),
        };
    },
    renderShapes: ({
        plot,
        labelsPlot,
        preparedData,
        seriesOptions,
        dispatcher,
    }: RenderShapesArgs<PreparedAreaRangeData, PreparedSeriesOptions>) => {
        const data = preparedData;
        const allowOverlap = data.some((item) => item.series.dataLabels.allowOverlap);
        return renderAreaRange({plot, labelsPlot}, data, seriesOptions, allowOverlap, dispatcher);
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: ({item}) => getAreaRangeWidth(item.data),
        header: {getValue: getTooltipXValue, axis: 'x'},
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
                    {id: 'name', source: 'series.name', align: 'start'},
                    {
                        id: 'value',
                        source: ({item}) => getAreaRangeWidth(item.data),
                        formatValue: ({item, format}) => {
                            const {y0, y1} = item.data;

                            return y0 === null || y1 === null
                                ? ''
                                : formatAreaRange({y0, y1, format});
                        },
                        align: 'end',
                    },
                ],
            },
        ],
    },
} satisfies SeriesPlugin<{
    raw: AreaRangeSeries;
    prepared: PreparedAreaRangeSeries;
    shape: PreparedAreaRangeData;
    options: ChartSeriesOptions;
    tooltipChunk: AreaRangeTooltipChunk;
    interaction: AreaRangeInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
