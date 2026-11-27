import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';

import type {HeatmapSeries, TooltipDataChunkHeatmap} from '../../types';

import {heatmapDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import {prepareHeatmapData} from './prepare-data';
import {prepareHeatmapSeries} from './prepare-heatmap-series';
import type {PreparedHeatmapSeries} from './prepared-series';
import {renderHeatmap} from './renderer';
import type {PreparedHeatmapData} from './types';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.[0]) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareHeatmapData({
        series: series[0] as PreparedHeatmapSeries,
        xAxis,
        xScale,
        yAxis: yAxis![0],
        yScale: yScale[0]!,
    });

    return {renderData: [data], tooltipItems: [data]};
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs) {
    return renderHeatmap(
        {plot, labelsPlot},
        preparedData[0] as PreparedHeatmapData,
        seriesOptions,
        dispatcher,
    );
}

export const heatmapPlugin: SeriesPlugin<HeatmapSeries, TooltipDataChunkHeatmap> = {
    type: 'heatmap',
    optionsDefaults: heatmapDefaults,
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
};
