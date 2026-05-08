import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedBarYSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/bar-y/get-tooltip-data';
import {prepareBarYData} from '~core/shapes/bar-y/prepare-data';
import {renderBarY} from '~core/shapes/bar-y/renderer';
import type {BarYShapesArgs} from '~core/shapes/bar-y/types';

import type {BarYSeries} from '../../types';

import {prepareBarYSeries} from './prepare';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale, boundsHeight, boundsWidth} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarYData({
        boundsHeight,
        boundsWidth,
        series: series as PreparedBarYSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
    });

    return {renderData: [data], tooltipItems: data.shapes};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderBarY({plot}, preparedData[0] as BarYShapesArgs, seriesOptions, dispatcher);
}

export const barYPlugin: SeriesPlugin<BarYSeries> = {
    type: 'bar-y',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareBarYSeries({series: series as BarYSeries[], seriesOptions, legend, colorScale}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
