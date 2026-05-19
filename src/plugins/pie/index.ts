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
import {getTooltipColorSymbol} from '~core/tooltip/utils';

import type {PieSeries} from '../../types';

import {preparePieSeries} from './prepare-pie-series';

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
    useClipPath: false,
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        preparePieSeries({series: series as PieSeries[], seriesOptions, legend, colors}),
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
                    {id: 'value', source: 'data.value'},
                ],
            },
        },
    },
};
