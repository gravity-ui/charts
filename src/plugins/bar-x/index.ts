import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getStackedDomainValues} from '~core/series/stacked-domain';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {BarXFormatContext, ChartSeries, ChartSeriesOptions} from '~core/types';
import {filterLayerLabels} from '~core/utils';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';
import {filterPoints} from '~core/zoom/filter-data';

import type {BarXSeries} from '../../types';
import {getBarDomainData} from '../bar-domain';
import {validateBarGrouping} from '../bar-grouping';
import {validateBarLabelPlacement} from '../bar-label-placement';
import {validateBarOpacity} from '../bar-opacity';
import {validateBarMaxWidth, validateBarPadding} from '../bar-sizing';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';
import {getPercentStackDomain} from '../stacked-axis';

import {barXDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {BarXInteractionItem} from './interaction-types';
import {prepareBarXSeries} from './prepare-bar-x-series';
import {prepareBarXData} from './prepare-data';
import type {PreparedBarXSeries} from './prepared-series';
import {renderBarX} from './renderer';
import {getBarXStackLabelAnchors} from './stack-labels';
import type {BarXTooltipChunk, PreparedBarXData} from './types';

import './styles.scss';

async function prepareShapeData(
    args: PrepareShapeDataArgs<PreparedBarXSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareShapeDataResult<PreparedBarXData, PreparedBarXData>> {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight,
        boundsWidth,
        split,
        isRangeSlider,
        otherLayers = [],
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarXData({
        series: series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsHeight,
        boundsWidth,
        split,
        isRangeSlider,
    });

    const labels = await prepareStackLabels({
        ...args,
        anchors: isRangeSlider ? [] : getBarXStackLabelAnchors(data, args),
        otherLayers,
    });
    const filteredData = filterLayerLabels(data, [
        ...otherLayers,
        {svgLabels: labels, htmlLabels: []},
    ]);
    return {
        renderData: filteredData,
        annotations: filteredData.flatMap((item) => item.annotations),
        htmlLabels: filteredData.flatMap((item) => item.htmlLabels),
        layoutData: filteredData,
        tooltipItems: filteredData,
        labels,
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    labels,
    seriesOptions,
    boundsWidth,
    boundsHeight,
    dispatcher,
}: RenderShapesArgs<PreparedBarXData, PreparedSeriesOptions>) {
    const data = preparedData;
    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    const cleanup = renderBarX(
        {plot, labelsPlot, boundsWidth, boundsHeight},
        data,
        seriesOptions,
        allowOverlap,
        dispatcher,
    );
    renderStackLabels(labelsPlot, labels);
    return cleanup;
}

export const barXPlugin = {
    type: 'bar-x',
    defaults: barXDefaults,
    axes: {
        x: {bandPadding: 0.5},
        y: {
            baseline: 0,
            getFixedDomain: getPercentStackDomain,
            getData: ({series}) => ({
                domainValues: getStackedDomainValues({
                    series,
                    categoryKey: 'x',
                    valueKey: 'y',
                    getData: (item) => getBarDomainData(item, 'x', 'y'),
                }),
            }),
        },
    },
    zoom: {
        types: ['x', 'xy'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {axes: series.stacking ? 'x' : 'xy'}),
    },
    prepareSeries: prepareBarXSeries,
    validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
        validateBarLabelPlacement(series.dataLabels);
        validateBarPadding(series.barPadding);
        validateBarMaxWidth(series.barMaxWidth);
        validateBarOpacity(series.opacity, 'opacity');
        validateBarOpacity(seriesOptions?.['bar-x']?.opacity, 'series.options.bar-x.opacity');
        series.data.forEach((point, index) => {
            validateBarOpacity(point.opacity, `data[${index}].opacity`);
        });
        validateStackLabelsOptions({
            series,
            allSeries,
            options: seriesOptions?.['bar-x']?.stackLabels,
        });
        validateAxisPlotValues({series, xAxis, yAxis});
        validateXYSeries({series, xAxis, yAxis});
        validateStacking({series});
        validateBarGrouping({series, allSeries});
        validatePercentStackingValues({
            series,
            valueKey: 'y',
            valueAxisType: yAxis?.[series.yAxis ?? 0]?.type,
        });
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
                        formatValue: ({item, value}) => {
                            const {data, series} = item;
                            return getTooltipColorSymbol({
                                color: String(value),
                                opacity: data.opacity ?? series.opacity ?? 1,
                            });
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
    raw: BarXSeries;
    prepared: PreparedBarXSeries;
    shape: PreparedBarXData;
    options: ChartSeriesOptions;
    tooltipChunk: BarXTooltipChunk;
    interaction: BarXInteractionItem;
    formatContext: BarXFormatContext;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
