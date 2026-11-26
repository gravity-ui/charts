import {i18n} from '~core/i18n';
import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {AreaFormatContext, ChartSeries, ChartSeriesOptions} from '~core/types';
import {filterLayerLabels} from '~core/utils';
import {createGradientGeometryPreparer, getGradientGeometry} from '~core/utils/gradient-geometry';
import type {GetTooltipDataArgs} from '~core/utils/tooltip-helpers';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateSeriesColor,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaSeries} from '../../types';
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
import {getAreaProjectionArgs} from './projection';
import {renderArea} from './renderer';
import {getAreaStackLabelAnchors} from './stack-labels';
import type {AreaTooltipChunk, PreparedAreaData} from './types';
import {validateAreaInterpolation} from './validation';
import {filterAreaData} from './zoom';

import './styles.scss';

export const areaPlugin = {
    type: 'area',
    series: {
        optionsDefaults: areaDefaults,
        validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
            validateAreaInterpolation(series, allSeries);
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
        prepare: prepareAreaSeries,
    },
    axes: {
        x: {singleValueDomain: 'center'},
        y: {
            baseline: 0,
            singleValueDomain: 'center',
            getFixedDomain: getPercentStackDomain,
            getData: getAreaAxisData,
        },
        padding: {getPaintExtents: getAreaAxisPadding},
    },
    colorScale: {
        getValue: (d) => d.y,
    },
    layers: {
        prepareData: async function (
            args: PrepareLayerArgs<PreparedAreaSeries, PreparedSeriesOptions, PreparedSeries>,
        ): Promise<PrepareLayerResult<PreparedAreaData, PreparedAreaData>> {
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
                otherLabelLayouts = [],
            } = args;

            if (!xAxis || !xScale || !yScale?.length || !split) {
                return {renderData: [], lookupItems: []};
            }

            const data = await prepareAreaData(
                getAreaProjectionArgs({
                    series: series,
                    seriesOptions,
                    xAxis,
                    xScale,
                    yAxis: yAxis ?? [],
                    yScale,
                    split,
                    isOutsideBounds: isOutsideBounds ?? (() => false),
                    isRangeSlider,
                    boundsWidth: args.boundsWidth,
                }),
            );

            const svgLabels = await prepareStackLabels({
                ...args,
                anchors: isRangeSlider ? [] : getAreaStackLabelAnchors(data, args),
                otherLabelLayouts,
            });
            const filteredData = filterLayerLabels(data, [
                ...otherLabelLayouts,
                {svgLabels: svgLabels, htmlLabels: []},
            ]);
            return {
                renderData: filteredData,
                markers: filteredData.flatMap((item) => item.markers),
                annotations: filteredData.flatMap((item) => item.annotations),
                htmlLabels: filteredData.flatMap((item) => item.htmlLabels),
                getHoverMarkers: (hovered) =>
                    filteredData.flatMap((item) => item.getHoverMarkers(hovered)),
                labelLayout: filteredData,
                lookupItems: filteredData,
                svgLabels,
                gradientGeometry: getGradientGeometry(filteredData),
            };
        },
        prepareGradientGeometry: createGradientGeometryPreparer<PreparedAreaSeries>(
            (args) => projectAreaData(getAreaProjectionArgs(args)),
            {
                includeSolidSeries: true,
            },
        ),
        render: function ({
            plot,
            labelsPlot,
            renderData,
            seriesOptions,
            dispatcher,
            svgLabels,
        }: RenderLayerArgs<PreparedAreaData, PreparedSeriesOptions>) {
            const allowOverlap = renderData.some((d) => d.series.dataLabels.allowOverlap);
            const cleanup = renderArea(
                {plot, labelsPlot},
                renderData,
                seriesOptions,
                allowOverlap,
                dispatcher,
            );
            renderStackLabels(labelsPlot, svgLabels);
            return cleanup;
        },
    },
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: filterAreaData,
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData(args: GetTooltipDataArgs<PreparedAreaData>) {
            const {data, measureDistance} = args;
            return getTooltipData({
                ...args,
                measureDistance:
                    measureDistance ||
                    (data.length > 1 &&
                        data.some(({series, geometry}) => series.stacking && geometry)),
            });
        },
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
} satisfies SeriesPlugin<{
    raw: AreaSeries;
    prepared: PreparedAreaSeries;
    shape: PreparedAreaData;
    options: ChartSeriesOptions;
    tooltipChunk: AreaTooltipChunk;
    interaction: AreaInteractionItem;
    formatContext: AreaFormatContext;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
