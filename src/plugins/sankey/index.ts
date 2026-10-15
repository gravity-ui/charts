import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSankeySeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/sankey/get-tooltip-data';
import {prepareSankeyData} from '~core/shapes/sankey/prepare-data';
import {renderSankey} from '~core/shapes/sankey/renderer';
import type {PreparedSankeyData} from '~core/shapes/sankey/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {getSourcePoint} from '~core/utils/source-point';

import type {SankeySeries, TooltipDataChunkSankey} from '../../types';

import {getTargetElements, prepareNearestData} from './interaction';
import {prepareSankeySeries} from './prepare-sankey-series';

function getLinkValue({target, data: source, value}: TooltipDataChunkSankey) {
    return value ?? source.links.find((link) => link.name === target?.name)?.value;
}

function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): PrepareShapeDataResult {
    const data = prepareSankeyData({
        series: series[0] as PreparedSankeySeries,
        width: boundsWidth,
        height: boundsHeight,
    });
    return {renderData: [data], tooltipItems: [data]};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderSankey({plot}, preparedData[0] as PreparedSankeyData, seriesOptions, dispatcher);
}

export const sankeyPlugin: SeriesPlugin<SankeySeries, TooltipDataChunkSankey> = {
    type: 'sankey',
    getClipPath: () => false,
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareSankeySeries({series: series as SankeySeries[], seriesOptions, legend, colorScale}),
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
        getClosestItem: (item) => {
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
                            const {target, data: source} = item as TooltipDataChunkSankey;
                            return `${source.name} → ${target?.name}`;
                        },
                        align: 'start',
                    },
                    {
                        id: 'value',
                        source: ({item}) => getLinkValue(item as TooltipDataChunkSankey),
                        align: 'end',
                    },
                ],
            },
        ],
    },
};
