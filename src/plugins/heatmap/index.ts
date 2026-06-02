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
import {getTooltipColorSymbol} from '~core/tooltip/utils';

import type {HeatmapSeries} from '../../types';

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

export const heatmapPlugin: SeriesPlugin<HeatmapSeries> = {
    type: 'heatmap',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareHeatmapSeries({
            series: series as HeatmapSeries[],
            seriesOptions,
            legend,
            colorScale,
        }),
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        rows: [
            {
                id: 'default',
                cells: [
                    {
                        id: 'color',
                        source: 'color',
                        format: {
                            type: 'custom',
                            formatter: ({value}) => {
                                return value ? getTooltipColorSymbol({color: String(value)}) : '';
                            },
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
