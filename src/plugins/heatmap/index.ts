import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
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

async function prepareShapeData(
    args: PrepareShapeDataArgs<PreparedHeatmapSeries, PreparedSeriesOptions, PreparedSeries>,
): Promise<PrepareShapeDataResult<PreparedHeatmapData, PreparedHeatmapData>> {
    const {series, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.[0]) {
        return {renderData: [], tooltipItems: []};
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
        layoutData: [data],
        tooltipItems: [data],
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs<PreparedHeatmapData, PreparedSeriesOptions>) {
    return renderHeatmap({plot, labelsPlot}, preparedData[0], seriesOptions, dispatcher);
}

export const heatmapPlugin = {
    type: 'heatmap',
    defaults: heatmapDefaults,
    axes: {
        x: {bandPadding: 0.5, grid: 'hidden', padding: {max: 0}},
        y: {bandPadding: 0.5, grid: 'hidden', padding: {max: 0}},
    },
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareHeatmapSeries({
            series: series as HeatmapSeries[],
            seriesOptions,
            legend,
            colorScale,
        }),
    getColorValue: (d) => d.value,
    prepareShapeData,
    renderShapes,
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
