import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getStackedDomainValues} from '~core/series/stacked-domain';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import type {BarYFormatContext, ChartSeries, ChartSeriesOptions} from '~core/types';
import {hasOutsideOnlyPlacement} from '~core/utils/rect-label-placement';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';
import {filterPoints} from '~core/zoom/filter-data';

import type {BarYSeries} from '../../types';
import {getBarDomainData} from '../bar-domain';
import {validateBarGrouping} from '../bar-grouping';
import {validateBarLabelPlacement} from '../bar-label-placement';
import {validateBarOpacity} from '../bar-opacity';
import {validateBarMaxWidth, validateBarPadding} from '../bar-sizing';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';
import {getPercentStackDomain} from '../stacked-axis';

import {barYDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {BarYInteractionItem} from './interaction-types';
import {prepareBarYSeries} from './prepare-bar-y-series';
import {filterBarYDataLabels, prepareBarYData} from './prepare-data';
import type {PreparedBarYSeries} from './prepared-series';
import {renderBarY} from './renderer';
import {getBarYStackLabelAnchors} from './stack-labels';
import type {BarYShapesArgs, BarYTooltipChunk, PreparedBarYData} from './types';

import './styles.scss';

async function prepareShapeData(
    args: PrepareShapeDataArgs<PreparedBarYSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareShapeDataResult<BarYShapesArgs, PreparedBarYData>> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale, boundsHeight, boundsWidth} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarYData({
        series: series,
        seriesOptions,
        boundsWidth,
        boundsHeight,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
    });

    const labels = await prepareStackLabels({
        ...args,
        anchors: args.isRangeSlider
            ? []
            : getBarYStackLabelAnchors(data.shapes, {
                  xScale,
                  boundsWidth,
                  seriesOptions,
                  yAxis,
              }),
    });

    const filteredData = filterBarYDataLabels(data, [
        ...(args.otherLayers ?? []),
        {svgLabels: labels, htmlLabels: []},
    ]);

    return {
        renderData: [filteredData],
        htmlLabels: filteredData.htmlLabels,
        layoutData: [filteredData],
        tooltipItems: data.shapes,
        labels,
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
    labels,
}: RenderShapesArgs<BarYShapesArgs, PreparedSeriesOptions>) {
    const cleanup = renderBarY({plot, labelsPlot}, preparedData[0], seriesOptions, dispatcher);
    renderStackLabels(labelsPlot, labels);
    return cleanup;
}

export const barYPlugin = {
    type: 'bar-y',
    defaults: barYDefaults,
    axes: {
        x: {
            baseline: 0,
            getFixedDomain: getPercentStackDomain,
            getData: ({series}) => ({
                domainValues: getStackedDomainValues({
                    series,
                    categoryKey: 'y',
                    valueKey: 'x',
                    getData: (item) => getBarDomainData(item, 'y', 'x'),
                }),
            }),
        },
        y: {
            bandPadding: 0.5,
            getTicks: ({values, count}) =>
                values.length < 3
                    ? {values: values as readonly number[]}
                    : {count: Math.min(count ?? values.length, values.length)},
        },
    },
    zoom: {
        types: ['y', 'xy'],
        defaultType: 'y',
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {axes: series.stacking ? 'y' : 'xy'}),
    },
    prepareSeries: prepareBarYSeries,
    validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
        validateBarLabelPlacement(series.dataLabels);
        validateBarPadding(series.barPadding);
        validateBarMaxWidth(series.barMaxWidth);
        validateBarOpacity(series.opacity, 'opacity');
        validateBarOpacity(seriesOptions?.['bar-y']?.opacity, 'series.options.bar-y.opacity');
        series.data.forEach((point, index) => {
            validateBarOpacity(point.opacity, `data[${index}].opacity`);
        });
        validateStackLabelsOptions({
            series,
            allSeries,
            options: seriesOptions?.['bar-y']?.stackLabels,
        });
        validateAxisPlotValues({series, xAxis, yAxis});
        validateXYSeries({series, xAxis, yAxis});
        validateStacking({series});
        validateBarGrouping({series, allSeries});
        validatePercentStackingValues({series, valueKey: 'x', valueAxisType: xAxis?.type});
    },
    axisPadding: {
        getXDomainReserve: ({dataLabels, stacking}) =>
            stacking !== 'percent' &&
            (hasOutsideOnlyPlacement(dataLabels.placement) ||
                (dataLabels.placement === undefined && !dataLabels.inside))
                ? dataLabels.maxWidth + dataLabels.padding
                : 0,
    },
    getColorValue: (d) => d.x,
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipXValue,
        header: {getValue: getTooltipYValue, axis: 'y', priority: 1},
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
                    {id: 'value', source: 'data.x', align: 'end'},
                ],
            },
        ],
    },
} satisfies SeriesPlugin<{
    raw: BarYSeries;
    prepared: PreparedBarYSeries;
    shape: BarYShapesArgs;
    options: ChartSeriesOptions;
    tooltipChunk: BarYTooltipChunk;
    interaction: BarYInteractionItem;
    formatContext: BarYFormatContext;
    tooltipItem: PreparedBarYData;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
