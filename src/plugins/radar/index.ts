import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedRadarSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/radar/get-tooltip-data';
import {prepareRadarData} from '~core/shapes/radar/prepare-data';
import {renderRadar} from '~core/shapes/radar/renderer';
import type {PreparedRadarData} from '~core/shapes/radar/types';

import type {RadarSeries} from '../../types';

import {prepareRadarSeries} from './prepare';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const data = await prepareRadarData({
        series: series as PreparedRadarSeries[],
        boundsWidth,
        boundsHeight,
    });
    return {renderData: data, tooltipItems: data};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderRadar({plot}, preparedData as PreparedRadarData[], seriesOptions, dispatcher);
}

export const radarPlugin: SeriesPlugin<RadarSeries> = {
    type: 'radar',
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        prepareRadarSeries({series: series as RadarSeries[], seriesOptions, legend, colors}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
