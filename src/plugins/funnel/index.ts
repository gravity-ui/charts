import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';
import type {CustomFormatContext} from '~core/types';

import type {FunnelSeries} from '../../types';
import type {BuiltinPluginData} from '../plugin-data';

import {funnelDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {FunnelInteractionItem} from './interaction-types';
import {prepareFunnelData} from './prepare-data';
import {prepareFunnelSeries} from './prepare-funnel-series';
import type {PreparedFunnelSeries} from './prepared-series';
import {renderFunnel} from './renderer';
import type {FunnelTooltipChunk, PreparedFunnelData} from './types';

import './styles.scss';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs<PreparedFunnelSeries>): Promise<
    PrepareShapeDataResult<PreparedFunnelData, PreparedFunnelData>
> {
    const data = await prepareFunnelData({
        series: series,
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
}: RenderShapesArgs<PreparedFunnelData>) {
    return renderFunnel({plot, labelsPlot}, preparedData[0], seriesOptions, dispatcher);
}

export const funnelPlugin: SeriesPlugin<
    FunnelSeries,
    FunnelTooltipChunk,
    CustomFormatContext,
    BuiltinPluginData<PreparedFunnelSeries, PreparedFunnelData, FunnelInteractionItem>
> = {
    type: 'funnel',
    defaults: funnelDefaults,
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
