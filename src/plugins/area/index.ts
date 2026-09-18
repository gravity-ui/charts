import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedAreaSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import {prepareAreaData} from '~core/shapes/area/prepare-data';
import {renderArea} from '~core/shapes/area/renderer';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {filterLayerLabels} from '~core/utils';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateSeriesColor,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaFormatContext, AreaSeries, TooltipDataChunkArea} from '../../types';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';

import {prepareAreaSeries} from './prepare-area-series';
import {getAreaStackLabelAnchors} from './stack-labels';

export const areaPlugin: SeriesPlugin<AreaSeries, TooltipDataChunkArea, AreaFormatContext> = {
    type: 'area',
    prepareSeries: prepareAreaSeries,
    validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
        validateStackLabelsOptions({
            series,
            allSeries,
            options: seriesOptions?.area?.stackLabels,
        });
        validateAxisPlotValues({series, xAxis, yAxis});
        validateSeriesColor({color: series.color, seriesName: series.name});
        validateSeriesColor({color: series.fillColor, seriesName: series.name});
        validateXYSeries({series, xAxis, yAxis});
        validateStacking({series});
        validatePercentStackingValues({
            series,
            valueKey: 'y',
            valueAxisType: yAxis?.[series.yAxis ?? 0]?.type,
        });

        const isStacking = ['normal', 'percent'].includes(series.stacking as string);
        if (isStacking && series.nullMode === 'connect') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_stacking-area-connect-null-mode'),
            });
        }
    },
    getColorValue: (d) => d.y,
    prepareShapeData: async function (args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
        const {
            series,
            seriesOptions,
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

        const data = await prepareAreaData({
            series: series as PreparedAreaSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis: yAxis ?? [],
            yScale,
            split,
            isOutsideBounds: isOutsideBounds ?? (() => false),
            isRangeSlider,
        });

        const filteredData = filterLayerLabels(data, otherLayers);
        const labels = await prepareStackLabels({
            ...args,
            anchors: isRangeSlider ? [] : getAreaStackLabelAnchors(data, args),
            otherLayers: [...otherLayers, ...filteredData],
        });
        return {renderData: filteredData, tooltipItems: filteredData, labels};
    },
    renderShapes: function ({
        plot,
        preparedData,
        seriesOptions,
        dispatcher,
        labels,
    }: RenderShapesArgs) {
        const data = preparedData as PreparedAreaData[];
        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        const cleanup = renderArea({plot}, data, seriesOptions, allowOverlap, dispatcher);
        renderStackLabels(plot, labels);
        return cleanup;
    },
    tooltip: {
        prepareData: getTooltipData,
        getValueFormatContext: (item) => {
            return {percentage: item.percentage, data: item.data};
        },
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
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        ],
    },
};
