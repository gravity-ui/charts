import {getSingleSeriesLayer} from '~core/series/layers';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedHeatmapSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/heatmap/get-tooltip-data';
import {prepareHeatmapData} from '~core/shapes/heatmap/prepare-data';
import {renderHeatmap} from '~core/shapes/heatmap/renderer';
import type {PreparedHeatmapData} from '~core/shapes/heatmap/types';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';

import type {HeatmapSeries, TooltipDataChunkHeatmap} from '../../types';

import {prepareHeatmapSeries} from './prepare-heatmap-series';

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

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderHeatmap({plot}, preparedData[0] as PreparedHeatmapData, seriesOptions, dispatcher);
}

export const heatmapPlugin: SeriesPlugin<HeatmapSeries, TooltipDataChunkHeatmap> = {
    type: 'heatmap',
    getLayers: getSingleSeriesLayer,
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
