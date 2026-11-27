import {isValueInAxisRange} from '~core/series/domain-points';
import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getTooltipColorSymbol, getTooltipYValue} from '~core/tooltip/utils';
import {getFormattedValue} from '~core/utils/format';
import {filterPoints} from '~core/zoom/filter-data';

import type {TooltipDataChunkXRange, XRangeSeries, XRangeSeriesData} from '../../types';

import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import {prepareXRangeData} from './prepare-data';
import {prepareXRangeSeries} from './prepare-x-range-series';
import type {PreparedXRangeSeries} from './prepared-series';
import {renderXRange} from './renderer';
import type {PreparedXRangeData} from './types';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, xAxis, xScale, yAxis, yScale, boundsWidth, isRangeSlider} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareXRangeData({
        series: series as PreparedXRangeSeries[],
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsWidth,
        isRangeSlider,
    });

    return {renderData: data, tooltipItems: data};
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs) {
    return renderXRange(
        {plot, labelsPlot},
        preparedData as PreparedXRangeData[],
        seriesOptions,
        dispatcher,
    );
}

function getXRangeWidth(data: XRangeSeriesData) {
    return Math.abs(Number(data.x1) - Number(data.x0));
}

export const xRangePlugin: SeriesPlugin<XRangeSeries, TooltipDataChunkXRange> = {
    type: 'x-range',
    axes: {
        x: {
            getData: ({series}) => ({
                values: series.flatMap((item) =>
                    item.data.flatMap((point) =>
                        point.x0 !== null && point.x1 !== null ? [point.x0, point.x1] : [],
                    ),
                ),
                domainValues: series.flatMap((item) =>
                    item.data.flatMap((point) => [point.x0, point.x1]),
                ),
            }),
        },
    },
    zoom: {
        types: ['x'],
        defaultType: 'x',
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {
                isXInRange: (point, axis) =>
                    isValueInAxisRange(point.x0, axis) || isValueInAxisRange(point.x1, axis),
            }),
    },
    prepareSeries: prepareXRangeSeries,
    // Use bar duration (x1 - x0) as the color value so that longer bars can be
    // visually distinguished by color intensity.
    getColorValue: getXRangeWidth,
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: ({item, xAxis}) =>
            xAxis?.type === 'category' ? undefined : getXRangeWidth(item.data),
        header: {getValue: getTooltipYValue, axis: 'y', priority: 1},
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
                    {
                        id: 'value',
                        source: ({item}) => {
                            const {data, series} = item as TooltipDataChunkXRange;
                            const format = (series as unknown as PreparedXRangeSeries).tooltip
                                ?.valueFormat;
                            const x0 = getFormattedValue({value: data.x0, format}) ?? data.x0;
                            const x1 = getFormattedValue({value: data.x1, format}) ?? data.x1;
                            return `${x0} — ${x1}`;
                        },
                        align: 'end',
                    },
                ],
            },
        ],
    },
};
