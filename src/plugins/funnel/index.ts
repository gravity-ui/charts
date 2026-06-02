import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedFunnelSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/funnel/get-tooltip-data';
import {prepareFunnelData} from '~core/shapes/funnel/prepare-data';
import {renderFunnel} from '~core/shapes/funnel/renderer';
import type {PreparedFunnelData} from '~core/shapes/funnel/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';

import type {FunnelSeries} from '../../types';

import {prepareFunnelSeries} from './prepare-funnel-series';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const data = await prepareFunnelData({
        series: series as PreparedFunnelSeries[],
        boundsWidth,
        boundsHeight,
    });
    return {renderData: [data], tooltipItems: [data]};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderFunnel({plot}, preparedData[0] as PreparedFunnelData, seriesOptions, dispatcher);
}

export const funnelPlugin: SeriesPlugin<FunnelSeries> = {
    type: 'funnel',
    useClipPath: false,
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        prepareFunnelSeries({series: series as FunnelSeries[], seriesOptions, legend, colors}),
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
