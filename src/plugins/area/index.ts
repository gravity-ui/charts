import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedAreaSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import {prepareAreaData} from '~core/shapes/area/prepare-data';
import {renderArea} from '~core/shapes/area/renderer';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {filterOverlappingLabels} from '~core/utils';

import type {AreaSeries} from '../../types';

import {prepareArea} from './prepare';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareAreaData({
        series: series as PreparedAreaSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        split,
        isOutsideBounds: isOutsideBounds ?? (() => false),
        isRangeSlider,
    });

    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    if (!allowOverlap) {
        const filtered = filterOverlappingLabels(data.flatMap((d) => d.htmlLabels));
        const [first, ...rest] = data;
        if (first) {
            const filteredData = [
                {...first, htmlLabels: filtered},
                ...rest.map((d) => ({...d, htmlLabels: [] as typeof d.htmlLabels})),
            ];
            return {renderData: filteredData, tooltipItems: filteredData};
        }
    }

    return {renderData: data, tooltipItems: data};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    const data = preparedData as PreparedAreaData[];
    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    return renderArea({plot}, data, seriesOptions, allowOverlap, dispatcher);
}

export const areaPlugin: SeriesPlugin<AreaSeries> = {
    type: 'area',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareArea({series: series as AreaSeries[], seriesOptions, legend, colorScale}),
    prepareShapeData,
    renderShapes,
    getTooltipData: getTooltipData as SeriesPlugin['getTooltipData'],
};
