import type {HeatmapSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedHeatmapSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareHeatmapData} from './prepare-data';
import {prepareHeatmapSeries} from './prepare-series';
import {renderHeatmap} from './renderer';
import type {PreparedHeatmapData} from './types';

const b = block('heatmap');

const heatmapShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderHeatmap(
            {plot: nodes.plot},
            preparedData as PreparedHeatmapData,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedHeatmapData).htmlElements;
    },
};

export const heatmapPlugin: SeriesPlugin = {
    type: 'heatmap',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareHeatmapSeries({
            series: series as HeatmapSeries[],
            legend,
            colorScale,
            seriesOptions,
        });
    },

    async prepareShapeData({
        chartSeries,
        xAxis,
        xScale,
        yAxis,
        yScale,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.[0]) {
            return null;
        }

        const preparedData = await prepareHeatmapData({
            series: chartSeries[0] as PreparedHeatmapSeries,
            xAxis,
            xScale,
            yAxis: yAxis[0],
            yScale: yScale[0],
        });

        return {data: preparedData, shapesData: [preparedData]};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const [data] = shapesData as PreparedHeatmapData[];
        const closestPoint = data?.items.find(
            (cell) =>
                pointerX >= cell.x &&
                pointerX <= cell.x + cell.width &&
                pointerY >= cell.y &&
                pointerY <= cell.y + cell.height,
        );
        if (!closestPoint) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestPoint.data,
                    series: data.series as unknown as HeatmapSeries,
                    closest: true,
                },
            ],
        };
    },

    shape: heatmapShapeConfig,
};
