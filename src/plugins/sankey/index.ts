import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';
import {getSourcePoint} from '~core/utils/source-point';

import type {SankeySeries} from '../../types';

import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {SankeyInteractionItem} from './interaction-types';
import {prepareSankeyData} from './prepare-data';
import {prepareSankeySeries} from './prepare-sankey-series';
import type {PreparedSankeySeries} from './prepared-series';
import {renderSankey} from './renderer';
import type {PreparedSankeyData, SankeyTooltipChunk} from './types';

function getLinkValue({target, data: source, value}: SankeyTooltipChunk) {
    return value ?? source.links.find((link) => link.name === target?.name)?.value;
}

function prepareLayer({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareLayerArgs<
    PreparedSankeySeries,
    PreparedSeriesOptions,
    PreparedSeries
>): PrepareLayerResult<PreparedSankeyData, PreparedSankeyData> {
    const data = prepareSankeyData({
        series: series[0],
        width: boundsWidth,
        height: boundsHeight,
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
}: RenderLayerArgs<PreparedSankeyData, PreparedSeriesOptions>) {
    return renderSankey({plot, labelsPlot}, renderData[0], seriesOptions, dispatcher);
}

export const sankeyPlugin = {
    type: 'sankey',
    series: {
        prepare: ({series, seriesOptions, legend, colorScale}) =>
            prepareSankeySeries({
                series: series as SankeySeries[],
                seriesOptions,
                legend,
                colorScale,
            }),
    },
    layers: {
        getClipMode: () => false,
        prepareData: prepareLayer,
        render: renderLayer,
    },
    interaction: {
        prepareNearestData,
        getTargetElements,
        getClosestItem: (item): SankeyInteractionItem => {
            const series = item.series as PreparedSankeySeries;
            const source = getSourcePoint(item.data);
            const value = getLinkValue(item);
            if (!item.target || value === undefined) {
                return {series, point: source};
            }
            return {
                series,
                point: {
                    kind: 'link',
                    source,
                    target: getSourcePoint(item.target),
                    value,
                },
            };
        },
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: ({item}) => getLinkValue(item),
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
                    {
                        id: 'name',
                        source: ({item}) => {
                            const {target, data: source} = item;
                            return `${source.name} → ${target?.name}`;
                        },
                        align: 'start',
                    },
                    {
                        id: 'value',
                        source: ({item}) => getLinkValue(item),
                        align: 'end',
                    },
                ],
            },
        ],
    },
} satisfies SeriesPlugin<{
    raw: SankeySeries;
    prepared: PreparedSankeySeries;
    shape: PreparedSankeyData;
    options: ChartSeriesOptions;
    tooltipChunk: SankeyTooltipChunk;
    interaction: SankeyInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
