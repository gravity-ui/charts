import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getTooltipColorSymbol, getTooltipScalarValue} from '~core/tooltip/utils';
import type {
    ChartSeries,
    ChartSeriesOptions,
    PieFormatContext,
    TooltipDataChunkPie,
} from '~core/types';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {PieSeries} from '../../types';

import {pieDefaults} from './defaults';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import type {PieInteractionItem} from './interaction-types';
import {preparePieData} from './prepare-data';
import {preparePieSeries} from './prepare-pie-series';
import type {PreparedPieSeries} from './prepared-series';
import {renderPie} from './renderer';
import type {PreparedPieData} from './types';

import './styles.scss';

async function prepareShapeData({
    series,
    boundsWidth,
    boundsHeight,
}: PrepareShapeDataArgs<PreparedPieSeries, PreparedSeriesOptions, PreparedSeries>): Promise<
    PrepareShapeDataResult<PreparedPieData, PreparedPieData>
> {
    const data = await preparePieData({
        series: series,
        boundsWidth,
        boundsHeight,
    });
    return {
        renderData: data,
        htmlLabels: data.flatMap((item) => item.htmlLabels),
        layoutData: data,
        tooltipItems: data,
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
    registerCompletion,
    signal,
}: RenderShapesArgs<PreparedPieData, PreparedSeriesOptions>) {
    return renderPie(
        {plot, labelsPlot},
        preparedData,
        seriesOptions,
        dispatcher,
        registerCompletion,
        signal,
    );
}

export const piePlugin = {
    type: 'pie',
    defaults: pieDefaults,
    getClipPath: () => false,
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        preparePieSeries({series: series as PieSeries[], seriesOptions, legend, colors}),
    validate: ({series}) => {
        series.data.forEach(({value}) => {
            if (typeof value !== 'number' && value !== null) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: i18n('error', 'label_invalid-pie-data-value'),
                });
            }
        });
    },
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
        getValueFormatContext: (item: TooltipDataChunkPie) => {
            return {
                percentage: item.percentage,
                name: item.data.name,
                data: item.data,
            };
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
    raw: PieSeries;
    prepared: PreparedPieSeries;
    shape: PreparedPieData;
    options: ChartSeriesOptions;
    tooltipChunk: TooltipDataChunkPie;
    interaction: PieInteractionItem;
    formatContext: PieFormatContext;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}>;
