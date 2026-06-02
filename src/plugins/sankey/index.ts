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

import type {SankeySeries, TooltipDataChunkSankey} from '../../types';

import {prepareSankeySeries} from './prepare-sankey-series';

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

export const sankeyPlugin: SeriesPlugin<SankeySeries> = {
    type: 'sankey',
    useClipPath: false,
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareSankeySeries({series: series as SankeySeries[], seriesOptions, legend, colorScale}),
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
                        source: ({item}) => {
                            const {target, data: source} = item as TooltipDataChunkSankey;
                            return source.links.find((d) => d.name === target?.name)?.value;
                        },
                        align: 'end',
                    },
                ],
            },
        ],
    },
};
