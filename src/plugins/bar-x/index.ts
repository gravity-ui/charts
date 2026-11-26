import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
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

async function prepareLayer(
    args: PrepareLayerArgs<PreparedBarXSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareLayerResult<PreparedBarXData, PreparedBarXData>> {
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
        otherLabelLayouts = [],
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], lookupItems: []};
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

    const svgLabels = await prepareStackLabels({
        ...args,
        anchors: isRangeSlider ? [] : getBarXStackLabelAnchors(data, args),
        otherLabelLayouts,
    });
    const filteredData = filterLayerLabels(data, [
        ...otherLabelLayouts,
        {svgLabels: svgLabels, htmlLabels: []},
    ]);
    return {
        renderData: filteredData,
        annotations: filteredData.flatMap((item) => item.annotations),
        htmlLabels: filteredData.flatMap((item) => item.htmlLabels),
        labelLayout: filteredData,
        lookupItems: filteredData,
        svgLabels,
    };
}

function renderLayer({
    plot,
    labelsPlot,
    renderData,
    svgLabels,
    seriesOptions,
    boundsWidth,
    boundsHeight,
    dispatcher,
}: RenderLayerArgs<PreparedBarXData, PreparedSeriesOptions>) {
    const allowOverlap = renderData.some((d) => d.series.dataLabels.allowOverlap);
    const cleanup = renderBarX(
        {plot, labelsPlot, boundsWidth, boundsHeight},
        renderData,
        seriesOptions,
        allowOverlap,
        dispatcher,
    );
    renderStackLabels(labelsPlot, svgLabels);
    return cleanup;
}

export const barXPlugin = {
    type: 'bar-x',
    series: {
        optionsDefaults: barXDefaults,
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
        prepare: prepareBarXSeries,
    },
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
    colorScale: {
        getValue: (d) => d.y,
    },
    layers: {
        prepareData: prepareLayer,
        render: renderLayer,
    },
    zoom: {
        types: ['x', 'xy'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {axes: series.stacking ? 'x' : 'xy'}),
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
