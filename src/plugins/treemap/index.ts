import {i18n} from '~core/i18n';
import type {
    PrepareLayerArgs,
    PrepareLayerResult,
    RenderLayerArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';
import type {ChartSeries, ChartSeriesOptions} from '~core/types';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {TreemapSeries} from '../../types';

import {treemapDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {TreemapInteractionItem} from './interaction-types';
import {prepareTreemapData} from './prepare-data';
import {prepareTreemap} from './prepare-treemap-series';
import type {PreparedTreemapSeries} from './prepared-series';
import {renderTreemap} from './renderer';
import type {PreparedTreemapData, TreemapTooltipChunk} from './types';

import './styles.scss';

async function prepareLayer({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareLayerArgs<PreparedTreemapSeries, PreparedSeriesOptions, PreparedSeries>): Promise<
    PrepareLayerResult<PreparedTreemapData, PreparedTreemapData>
> {
    const data = await prepareTreemapData({
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
}: RenderLayerArgs<PreparedTreemapData, PreparedSeriesOptions>) {
    return renderTreemap({plot, labelsPlot}, renderData[0], seriesOptions, dispatcher);
}

function validateTreemapData(series: TreemapSeries) {
    const parentIds: Record<string, boolean> = {};
    series.data.forEach((d) => {
        if (d.parentId && !parentIds[d.parentId]) {
            parentIds[d.parentId] = true;
        }
    });
    series.data.forEach((d) => {
        const opacity = d.opacity;
        if (
            opacity !== undefined &&
            (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity < 0 || opacity > 1)
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-series-property', {
                    key: 'data.opacity',
                    values: 'a finite number in [0, 1]',
                }),
            });
        }

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

export const treemapPlugin = {
    type: 'treemap',
    series: {
        optionsDefaults: treemapDefaults,
        validate: ({series, allSeries}) => {
            const treemapCount = allSeries.filter((s) => s.type === 'treemap').length;
            if (treemapCount > 1) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message:
                        'It looks like you are trying to define more than one "treemap" series.',
                });
            }

            validateTreemapData(series);
        },
        prepare: ({series, seriesOptions, legend, colorScale}) =>
            prepareTreemap({series: series as TreemapSeries[], seriesOptions, legend, colorScale}),
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
    raw: TreemapSeries;
    prepared: PreparedTreemapSeries;
    shape: PreparedTreemapData;
    options: ChartSeriesOptions;
    tooltipChunk: TreemapTooltipChunk;
    interaction: TreemapInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
