import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';

import type {FunnelSeries, TooltipDataChunkFunnel} from '../../types';

import {funnelDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import {prepareFunnelData} from './prepare-data';
import {prepareFunnelSeries} from './prepare-funnel-series';
import type {PreparedFunnelSeries} from './prepared-series';
import {renderFunnel} from './renderer';
import type {PreparedFunnelData} from './types';

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

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs) {
    return renderFunnel(
        {plot, labelsPlot},
        preparedData[0] as PreparedFunnelData,
        seriesOptions,
        dispatcher,
    );
}

export const funnelPlugin: SeriesPlugin<FunnelSeries, TooltipDataChunkFunnel> = {
    type: 'funnel',
    optionsDefaults: funnelDefaults,
    getClipPath: () => false,
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        prepareFunnelSeries({series: series as FunnelSeries[], seriesOptions, legend, colors}),
    getColorValue: (d) => d.value,
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipScalarValue,
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
