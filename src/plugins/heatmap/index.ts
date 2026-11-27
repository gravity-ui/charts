import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';

import type {HeatmapSeries} from '../../types';

import {heatmapDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {HeatmapInteractionItem} from './interaction-types';
import {prepareHeatmapData} from './prepare-data';
import {prepareHeatmapSeries} from './prepare-heatmap-series';
import type {PreparedHeatmapSeries} from './prepared-series';
import {renderHeatmap} from './renderer';
import type {HeatmapTooltipChunk, PreparedHeatmapData} from './types';

import './styles.scss';

async function prepareLayer(
    args: PrepareLayerArgs<PreparedHeatmapSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareLayerResult<PreparedHeatmapData, PreparedHeatmapData>> {
    const {series, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.[0]) {
        return {renderData: [], lookupItems: []};
    }

    const data = await prepareHeatmapData({
        series: series[0],
        xAxis,
        xScale,
        yAxis: yAxis![0],
        yScale: yScale[0]!,
    });

    return {
        renderData: [data],
        htmlLabels: data.htmlLabels,
        labelLayout: [data],
        lookupItems: [data],
    };
}

function renderLayer({
    plot,
    labelsPlot,
    renderData,
    seriesOptions,
    dispatcher,
}: RenderLayerArgs<PreparedHeatmapData, PreparedSeriesOptions>) {
    return renderHeatmap({plot, labelsPlot}, renderData[0], seriesOptions, dispatcher);
}

export const heatmapPlugin = {
    type: 'heatmap',
    series: {
        optionsDefaults: heatmapDefaults,
        prepare: ({series, seriesOptions, legend, colorScale}) =>
            prepareHeatmapSeries({
                series: series as HeatmapSeries[],
                seriesOptions,
                legend,
                colorScale,
            }),
    },
    axes: {
        x: {bandPadding: 0.5, grid: 'hidden', padding: {max: 0}},
        y: {bandPadding: 0.5, grid: 'hidden', padding: {max: 0}},
    },
    colorScale: {
        getValue: (d) => d.value,
    },
    layers: {
        prepareData: prepareLayer,
        render: renderLayer,
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipScalarValue,
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
                    {id: 'value', source: 'data.value', align: 'end'},
                ],
            },
        ],
    },
} satisfies SeriesPlugin<{
    raw: HeatmapSeries;
    prepared: PreparedHeatmapSeries;
    shape: PreparedHeatmapData;
    options: ChartSeriesOptions;
    tooltipChunk: HeatmapTooltipChunk;
    interaction: HeatmapInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
