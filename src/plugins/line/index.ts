import {i18n} from '~core/i18n';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedLineSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/line/get-tooltip-data';
import {prepareLineData} from '~core/shapes/line/prepare-data';
import {renderLine} from '~core/shapes/line/renderer';
import type {PreparedLineData} from '~core/shapes/line/types';
import {getTooltipLineSymbol} from '~core/tooltip/utils';
import {filterLayerLabels} from '~core/utils';
import {validateAxisPlotValues, validateXYSeries} from '~core/validation/helpers';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {LineSeries} from '../../types';

import {prepareLineSeries} from './prepare-line-series';

const AVAILABLE_INTERPOLATION_TYPES = ['linear', 'monotone', 'cardinal'];

function throwInvalidInterpolation(key: string, values: string | string[]): never {
    throw new ChartError({
        code: CHART_ERROR_CODE.INVALID_DATA,
        message: i18n('error', 'label_invalid-series-property', {key, values}),
    });
}

function validateInterpolation({interpolation}: {interpolation?: unknown}) {
    if (interpolation === undefined) {
        return;
    }

    if (
        typeof interpolation !== 'object' ||
        interpolation === null ||
        Array.isArray(interpolation)
    ) {
        throwInvalidInterpolation('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    const {type, tension} = interpolation as {tension?: unknown; type?: unknown};
    if (typeof type !== 'string' || !AVAILABLE_INTERPOLATION_TYPES.includes(type)) {
        throwInvalidInterpolation('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    if (
        type === 'cardinal' &&
        tension !== undefined &&
        (typeof tension !== 'number' || !Number.isFinite(tension) || tension < 0 || tension > 1)
    ) {
        throwInvalidInterpolation('interpolation.tension', '0 ≤ tension ≤ 1');
    }
}

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
        otherLayers,
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareLineData({
        series: series as PreparedLineSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        split,
        isOutsideBounds: isOutsideBounds ?? (() => false),
        isRangeSlider,
    });

    const filteredData = filterLayerLabels(data, otherLayers ?? []);
    return {renderData: filteredData, tooltipItems: filteredData};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderLine({plot}, preparedData as PreparedLineData[], seriesOptions, dispatcher);
}

export const linePlugin: SeriesPlugin<LineSeries> = {
    type: 'line',
    prepareSeries: prepareLineSeries,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({series, xAxis, yAxis});
        validateInterpolation(series);
        validateXYSeries({series, xAxis, yAxis});
    },
    getColorValue: (d) => d.y,
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
                        source: ({item}) => {
                            const s = item.series as PreparedLineSeries;
                            return getTooltipLineSymbol({
                                color: s.color,
                                dashStyle: s.dashStyle,
                                lineWidth: s.lineWidth,
                            });
                        },
                        width: '16px',
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        ],
    },
};
