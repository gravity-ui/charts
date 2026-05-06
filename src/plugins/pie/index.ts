import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedPieSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/pie/get-tooltip-data';
import {preparePieData} from '~core/shapes/pie/prepare-data';
import {renderPie} from '~core/shapes/pie/renderer';
import type {PreparedPieData} from '~core/shapes/pie/types';

import type {PieSeries} from '../../types';

import {preparePieSeries} from './prepare';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const data = await preparePieData({
        series: series as PreparedPieSeries[],
        boundsWidth,
        boundsHeight,
    });
    return {renderData: data, tooltipItems: data};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderPie({plot}, preparedData as PreparedPieData[], seriesOptions, dispatcher);
}

export const piePlugin: SeriesPlugin<PieSeries> = {
    type: 'pie',
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        preparePieSeries({series: series as PieSeries[], seriesOptions, legend, colors}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
