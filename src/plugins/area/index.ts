import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {AreaFormatContext} from '~core/types';
import {filterLayerLabels} from '~core/utils';
import {createGradientGeometryPreparer, getGradientGeometry} from '~core/utils/gradient-geometry';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateSeriesColor,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';
import {filterPoints} from '~core/zoom/filter-data';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaSeries, AreaSeriesData} from '../../types';
import type {BuiltinPluginData} from '../plugin-data';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';
import {getPercentStackDomain} from '../stacked-axis';

import {getAreaAxisPadding} from './axis-padding';
import {areaDefaults} from './defaults';
import {getAreaAxisData} from './domain';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {AreaInteractionItem} from './interaction-types';
import {prepareAreaSeries} from './prepare-area-series';
import {prepareAreaData, projectAreaData} from './prepare-data';
import type {PreparedAreaSeries} from './prepared-series';
import {renderArea} from './renderer';
import {getAreaStackLabelAnchors} from './stack-labels';
import type {AreaTooltipChunk, PreparedAreaData} from './types';

import './styles.scss';

function isAreaPointDefined(point: AreaSeriesData) {
    return point.y !== null && point.y !== undefined;
}

export const areaPlugin: SeriesPlugin<
    AreaSeries,
    AreaTooltipChunk,
    AreaFormatContext,
    BuiltinPluginData<PreparedAreaSeries, PreparedAreaData, AreaInteractionItem>
> = {
    type: 'area',
    defaults: areaDefaults,
    axes: {
        x: {singleValueDomain: 'center'},
        y: {
            baseline: 0,
            singleValueDomain: 'center',
            getFixedDomain: getPercentStackDomain,
            getData: getAreaAxisData,
        },
    },
    axisPadding: {getPaintExtents: getAreaAxisPadding},
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(
                series.nullMode === 'connect'
                    ? series.data.filter(isAreaPointDefined)
                    : series.data,
                viewport,
                {
                    mode: 'path',
                    axes: series.stacking ? 'x' : 'xy',
                    isDefined: isAreaPointDefined,
                },
            ),
    },
    prepareGradientGeometry: createGradientGeometryPreparer(projectAreaData, {
        includeSolidSeries: true,
    }),
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
    prepareShapeData: async function (
        args: PrepareShapeDataArgs<PreparedAreaSeries>,
    ): Promise<PrepareShapeDataResult<PreparedAreaData, PreparedAreaData>> {
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
            series: series,
            seriesOptions,
            xAxis,
            xScale,
            yAxis: yAxis ?? [],
            yScale,
            split,
            isOutsideBounds: isOutsideBounds ?? (() => false),
            isRangeSlider,
        });

        const labels = await prepareStackLabels({
            ...args,
            anchors: isRangeSlider ? [] : getAreaStackLabelAnchors(data, args),
            otherLayers,
        });
        const filteredData = filterLayerLabels(data, [
            ...otherLayers,
            {svgLabels: labels, htmlLabels: []},
        ]);
        return {
            renderData: filteredData,
            tooltipItems: filteredData,
            labels,
            gradientGeometry: getGradientGeometry(filteredData),
        };
    },
    renderShapes: function ({
        plot,
        labelsPlot,
        preparedData,
        seriesOptions,
        dispatcher,
        labels,
    }: RenderShapesArgs<PreparedAreaData>) {
        const data = preparedData;
        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        const cleanup = renderArea(
            {plot, labelsPlot},
            data,
            seriesOptions,
            allowOverlap,
            dispatcher,
        );
        renderStackLabels(labelsPlot, labels);
        return cleanup;
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipYValue,
        header: {getValue: getTooltipXValue, axis: 'x'},
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
