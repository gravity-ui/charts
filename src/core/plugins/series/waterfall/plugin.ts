import type {TooltipDataChunk, WaterfallSeries, WaterfallSeriesData} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedWaterfallSeries} from '../../../series/types';
import {filterOverlappingLabels} from '../../../utils';
import {getClosestPointsByXValue} from '../../../utils/tooltip-helpers';
import type {ShapePoint} from '../../../utils/tooltip-helpers';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareWaterfallData} from './prepare-data';
import {prepareWaterfallSeries} from './prepare-series';
import {renderWaterfall} from './renderer';
import type {PreparedWaterfallData} from './types';

const b = block('waterfall');

const waterfallShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b(), withClipPath: true}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderWaterfall(
            {plot: nodes.plot},
            preparedData as PreparedWaterfallData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        const data = preparedData as PreparedWaterfallData[];
        const items = data.flatMap((d) => d.htmlElements);
        const allowOverlap = data.some((d) => d?.series.dataLabels.allowOverlap);
        return allowOverlap ? items : filterOverlappingLabels(items);
    },
};

export const waterfallPlugin: SeriesPlugin = {
    type: 'waterfall',

    prepareSeries({series, legend, colorScale, colors}: SeriesPluginPrepareArgs) {
        return prepareWaterfallSeries({
            series: series as WaterfallSeries[],
            legend,
            colorScale,
            colors,
        });
    },

    async prepareShapeData({
        chartSeries,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareWaterfallData({
            series: chartSeries as PreparedWaterfallSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
        });

        return {data: preparedData, shapesData: preparedData};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const points = (shapesData as PreparedWaterfallData[]).map<ShapePoint>((d) => ({
            data: d.data as WaterfallSeriesData,
            series: d.series as WaterfallSeries,
            x: d.x + d.width / 2,
            y0: d.y,
            y1: d.y + d.height,
            subTotal: d.subTotal,
        }));
        return {chunks: getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[]};
    },

    shape: waterfallShapeConfig,
};
