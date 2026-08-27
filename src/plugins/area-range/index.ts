import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedAreaRangeSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import {prepareAreaRangeData} from '~core/shapes/area-range/prepare-data';
import {renderAreaRange} from '~core/shapes/area-range/renderer';
import type {PreparedAreaRangeData} from '~core/shapes/area-range/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {filterLayerLabels} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';
import {
    validateAxisPlotValues,
    validateSeriesColor,
    validateXYSeries,
} from '~core/validation/helpers';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaRangeSeries, TooltipDataChunkAreaRange} from '../../types';

import {prepareAreaRangeSeries} from './prepare-area-range-series';

export const areaRangePlugin: SeriesPlugin<AreaRangeSeries> = {
    type: 'area-range',
    prepareSeries: prepareAreaRangeSeries,
    getAxisDomainValues: {
        y: (data) => [data.low, data.high],
    },
    getColorValue: (data) =>
        data.low === null || data.high === null ? null : data.high - data.low,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.low}))},
            xAxis,
            yAxis,
        });
        validateXYSeries({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.low}))},
            xAxis,
            yAxis,
        });
        validateXYSeries({
            series: {...series, data: series.data.map((data) => ({x: data.x, y: data.high}))},
            xAxis,
            yAxis,
        });
        validateSeriesColor({color: series.color, seriesName: series.name});
        validateSeriesColor({color: series.fillColor, seriesName: series.name});

        if (
            series.data.some(
                (data) =>
                    data.low !== null && data.high !== null && Number(data.low) > Number(data.high),
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
    prepareShapeData: async (args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> => {
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
            series: series as PreparedAreaRangeSeries[],
            xAxis,
            xScale,
            yAxis: yAxis ?? [],
            yScale,
            split,
            isOutsideBounds: isOutsideBounds ?? (() => false),
            isRangeSlider,
        });
        const filteredData = filterLayerLabels(data, otherLayers);
        return {renderData: filteredData, tooltipItems: filteredData};
    },
    renderShapes: ({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) => {
        const data = preparedData as PreparedAreaRangeData[];
        const allowOverlap = data.some((item) => item.series.dataLabels.allowOverlap);
        return renderAreaRange({plot}, data, seriesOptions, allowOverlap, dispatcher);
    },
    tooltip: {
        prepareData: getTooltipData,
        rows: [
            {
                id: 'default',
                cells: [
                    {
                        id: 'color',
                        source: ({item}) =>
                            getTooltipColorSymbol({
                                color:
                                    (item as TooltipDataChunkAreaRange).color ??
                                    (item.series as unknown as PreparedAreaRangeSeries).color,
                            }),
                        width: '16px',
                    },
                    {id: 'name', source: 'series.name', align: 'start'},
                    {
                        id: 'value',
                        source: ({item}) => {
                            const chunk = item as TooltipDataChunkAreaRange;
                            const format = (chunk.series as unknown as PreparedAreaRangeSeries)
                                .tooltip?.valueFormat;
                            const low = getFormattedValue({value: chunk.data.low, format});
                            const high = getFormattedValue({value: chunk.data.high, format});
                            return `${low} – ${high}`;
                        },
                        align: 'end',
                    },
                ],
            },
        ],
    },
};
