import {i18n} from '~core/i18n';
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

import {CHART_ERROR_CODE, ChartError} from '../../libs';
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
    validate: ({series}) => {
        series.data.forEach(({value}) => {
            if (typeof value !== 'number' && value !== null) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: i18n('error', 'label_invalid-pie-data-value'),
                });
            }
        });
    },
    getColorValue: (d) => Number(d.value),
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        rows: [
            {
                id: 'default',
                cells: [
                    {
                        id: 'color',
                        source: 'color',
                        format: {
                            type: 'custom',
                            formatter: ({value}) => getTooltipColorSymbol({color: String(value)}),
                        },
                        width: '16px',
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.value', align: 'end'},
                ],
            },
        ],
    },
};
