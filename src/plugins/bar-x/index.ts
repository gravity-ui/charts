import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedBarXSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/bar-x/get-tooltip-data';
import {prepareBarXData} from '~core/shapes/bar-x/prepare-data';
import {renderBarX} from '~core/shapes/bar-x/renderer';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {filterOverlappingLabels} from '~core/utils';

import type {BarXSeries} from '../../types';

import {prepareBarXSeries} from './prepare-bar-x-series';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight,
        split,
        isRangeSlider,
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarXData({
        series: series as PreparedBarXSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsHeight,
        split,
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

function renderShapes({
    plot,
    preparedData,
    seriesOptions,
    boundsWidth,
    boundsHeight,
    dispatcher,
}: RenderShapesArgs) {
    const data = preparedData as PreparedBarXData[];
    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    return renderBarX(
        {plot, boundsWidth, boundsHeight},
        data,
        seriesOptions,
        allowOverlap,
        dispatcher,
    );
}

export const barXPlugin: SeriesPlugin<BarXSeries> = {
    type: 'bar-x',
    prepareSeries: prepareBarXSeries,
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        row: {
            cells: {
                items: [
                    {
                        id: 'color',
                        source: 'color',
                        format: {
                            type: 'custom',
                            formatter: ({value}) => {
                                return value ? getTooltipColorSymbol(String(value)) : '';
                            },
                        },
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        },
    },
};
