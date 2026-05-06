import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedTreemapSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/treemap/get-tooltip-data';
import {prepareTreemapData} from '~core/shapes/treemap/prepare-data';
import {renderTreemap} from '~core/shapes/treemap/renderer';
import type {PreparedTreemapData} from '~core/shapes/treemap/types';

import type {TreemapSeries} from '../../types';

import {prepareTreemap} from './prepare';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const data = await prepareTreemapData({
        series: series[0] as PreparedTreemapSeries,
        width: boundsWidth,
        height: boundsHeight,
    });
    return {renderData: [data], tooltipItems: [data]};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderTreemap({plot}, preparedData[0] as PreparedTreemapData, seriesOptions, dispatcher);
}

export const treemapPlugin: SeriesPlugin<TreemapSeries> = {
    type: 'treemap',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareTreemap({series: series as TreemapSeries[], seriesOptions, legend, colorScale}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
