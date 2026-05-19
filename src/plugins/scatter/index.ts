import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedScatterSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/scatter/get-tooltip-data';
import {prepareScatterData} from '~core/shapes/scatter/prepare-data';
import {renderScatter} from '~core/shapes/scatter/renderer';
import type {PreparedScatterShapeData} from '~core/shapes/scatter/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';

import type {ScatterSeries} from '../../types';

import {prepareScatterSeries} from './prepare-scatter-series';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, xAxis, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareScatterData({
        series: series as PreparedScatterSeries[],
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        split,
        isOutsideBounds: isOutsideBounds ?? (() => false),
        isRangeSlider,
    });

    return {renderData: [data], tooltipItems: data.scatterData};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderScatter(
        {plot},
        preparedData[0] as PreparedScatterShapeData,
        seriesOptions,
        dispatcher,
    );
}

export const scatterPlugin: SeriesPlugin<ScatterSeries> = {
    type: 'scatter',
    prepareSeries: prepareScatterSeries,
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
