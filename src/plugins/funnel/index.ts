import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';

import type {FunnelSeries} from '../../types';

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

async function prepareLayer({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareLayerArgs<PreparedFunnelSeries, PreparedSeriesOptions, PreparedSeries>): Promise<
    PrepareLayerResult<PreparedFunnelData, PreparedFunnelData>
> {
    const data = await prepareFunnelData({
        series: series,
        boundsWidth,
        boundsHeight,
    });
    return {
        renderData: [data],
        htmlLabels: data.htmlLabels,
        labelLayout: [data],
        lookupItems: [data],
    };
}

function renderLayer({
    plot,
    labelsPlot,
    renderData,
    seriesOptions,
    dispatcher,
}: RenderLayerArgs<PreparedFunnelData, PreparedSeriesOptions>) {
    return renderFunnel({plot, labelsPlot}, renderData[0], seriesOptions, dispatcher);
}

export const funnelPlugin = {
    type: 'funnel',
    series: {
        optionsDefaults: funnelDefaults,
        prepare: ({series, seriesOptions, legend, colors}) =>
            prepareFunnelSeries({series: series as FunnelSeries[], seriesOptions, legend, colors}),
    },
    colorScale: {
        getValue: (d) => d.value,
    },
    layers: {
        getClipMode: () => false,
        prepareData: prepareLayer,
        render: renderLayer,
    },
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
} satisfies SeriesPlugin<{
    raw: FunnelSeries;
    prepared: PreparedFunnelSeries;
    shape: PreparedFunnelData;
    options: ChartSeriesOptions;
    tooltipChunk: FunnelTooltipChunk;
    interaction: FunnelInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
