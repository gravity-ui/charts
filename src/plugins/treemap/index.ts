import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedTreemapSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/treemap/get-tooltip-data';
import {prepareTreemapData} from '~core/shapes/treemap/prepare-data';
import {renderTreemap} from '~core/shapes/treemap/renderer';
import type {PreparedTreemapData} from '~core/shapes/treemap/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {TreemapSeries} from '../../types';

import {prepareTreemap} from './prepare-treemap-series';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const data = await prepareTreemapData({
        series: series[0] as PreparedTreemapSeries,
        width: boundsWidth,
        height: boundsHeight,
    });
    return {renderData: [data], tooltipItems: [data]};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderTreemap({plot}, preparedData[0] as PreparedTreemapData, seriesOptions, dispatcher);
}

function validateTreemapData(series: TreemapSeries) {
    const parentIds: Record<string, boolean> = {};
    series.data.forEach((d) => {
        if (d.parentId && !parentIds[d.parentId]) {
            parentIds[d.parentId] = true;
        }
    });
    series.data.forEach((d) => {
        let idOrName = d.id;
        if (!idOrName) {
            idOrName = Array.isArray(d.name) ? d.name.join() : d.name;
        }

        if (parentIds[idOrName] && typeof d.value === 'number') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-redundant-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }

        if (!parentIds[idOrName] && typeof d.value !== 'number') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-treemap-missing-value', {
                    id: d.id,
                    name: d.name,
                }),
            });
        }
    });
}

export const treemapPlugin: SeriesPlugin<TreemapSeries> = {
    type: 'treemap',
    useClipPath: false,
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareTreemap({series: series as TreemapSeries[], seriesOptions, legend, colorScale}),
    validate: ({series, allSeries}) => {
        const treemapCount = allSeries.filter((s) => s.type === 'treemap').length;
        if (treemapCount > 1) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'It looks like you are trying to define more than one "treemap" series.',
            });
        }

        validateTreemapData(series);
    },
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
