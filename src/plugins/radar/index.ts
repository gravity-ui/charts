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
import type {RadarSeries} from '../../types';

import {radarDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {RadarInteractionItem} from './interaction-types';
import {prepareRadarData} from './prepare-data';
import {prepareRadarSeries} from './prepare-radar-series';
import type {PreparedRadarSeries} from './prepared-series';
import {renderRadar} from './renderer';
import type {PreparedRadarData, RadarTooltipChunk} from './types';

import './styles.scss';

async function prepareLayer({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareLayerArgs<PreparedRadarSeries, PreparedSeriesOptions, PreparedSeries>): Promise<
    PrepareLayerResult<PreparedRadarData, PreparedRadarData>
> {
    const data = await prepareRadarData({
        series: series,
        boundsWidth,
        boundsHeight,
    });
    return {
        renderData: data,
        htmlLabels: data.flatMap((item) => item.htmlLabels),
        labelLayout: data,
        lookupItems: data,
    };
}

function renderLayer({
    plot,
    labelsPlot,
    renderData,
    seriesOptions,
    dispatcher,
}: RenderLayerArgs<PreparedRadarData, PreparedSeriesOptions>) {
    return renderRadar({plot, labelsPlot}, renderData, seriesOptions, dispatcher);
}

export const radarPlugin = {
    type: 'radar',
    series: {
        optionsDefaults: radarDefaults,
        validate: ({series, allSeries}) => {
            if (
                series.categories !== undefined &&
                (!Array.isArray(series.categories) ||
                    !series.categories.every(
                        (category) =>
                            typeof category === 'object' &&
                            category !== null &&
                            !Array.isArray(category) &&
                            typeof category.key === 'string',
                    ))
            ) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message:
                        'Radar series.categories must be an array of objects with a string key',
                });
            }

            if (
                !allSeries.some(
                    (item) =>
                        item.type === 'radar' &&
                        Array.isArray(item.categories) &&
                        item.categories.length > 0,
                )
            ) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message:
                        'Radar categories must be specified as a nonempty array in series.categories',
                });
            }
        },
        prepare: ({series, seriesOptions, legend, colors}) =>
            prepareRadarSeries({series: series as RadarSeries[], seriesOptions, legend, colors}),
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
        header: {
            getValue: ({item}) => item.category?.key ?? null,
            priority: 2,
            requiresFormat: true,
        },
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
    raw: RadarSeries;
    prepared: PreparedRadarSeries;
    shape: PreparedRadarData;
    options: ChartSeriesOptions;
    tooltipChunk: RadarTooltipChunk;
    interaction: RadarInteractionItem;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
