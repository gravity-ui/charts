import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedWaterfallSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/waterfall/get-tooltip-data';
import {prepareWaterfallData} from '~core/shapes/waterfall/prepare-data';
import {renderWaterfall} from '~core/shapes/waterfall/renderer';
import type {PreparedWaterfallData} from '~core/shapes/waterfall/types';
import {filterOverlappingLabels} from '~core/utils';

import type {WaterfallSeries} from '../../types';

import {prepareWaterfallSeries} from './prepare-waterfall-series';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareWaterfallData({
        series: series as PreparedWaterfallSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
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
    const data = preparedData as PreparedWaterfallData[];
    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    return renderWaterfall({plot}, data, seriesOptions, allowOverlap, dispatcher);
}

export const waterfallPlugin: SeriesPlugin<WaterfallSeries> = {
    type: 'waterfall',
    prepareSeries: prepareWaterfallSeries,
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        row: {
            cells: {
                items: [
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        },
    },
};
