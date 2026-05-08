import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedXRangeSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/x-range/get-tooltip-data';
import {prepareXRangeData} from '~core/shapes/x-range/prepare-data';
import {renderXRange} from '~core/shapes/x-range/renderer';
import type {PreparedXRangeData} from '~core/shapes/x-range/types';

import type {XRangeSeries} from '../../types';

import {prepareXRangeSeries} from './prepare';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, xAxis, xScale, yAxis, yScale, boundsWidth, isRangeSlider} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareXRangeData({
        series: series as PreparedXRangeSeries[],
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsWidth,
        isRangeSlider,
    });

    return {renderData: data, tooltipItems: data};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderXRange({plot}, preparedData as PreparedXRangeData[], seriesOptions, dispatcher);
}

export const xRangePlugin: SeriesPlugin<XRangeSeries> = {
    type: 'x-range',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareXRangeSeries({series: series as XRangeSeries[], seriesOptions, legend, colorScale}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
