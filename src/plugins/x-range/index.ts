import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedXRangeSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/x-range/get-tooltip-data';
import {prepareXRangeData} from '~core/shapes/x-range/prepare-data';
import {renderXRange} from '~core/shapes/x-range/renderer';
import type {PreparedXRangeData} from '~core/shapes/x-range/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {getFormattedValue} from '~core/utils/format';

import type {TooltipDataChunkXRange, XRangeSeries} from '../../types';

import {prepareXRangeSeries} from './prepare-x-range-series';

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

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderXRange({plot}, preparedData as PreparedXRangeData[], seriesOptions, dispatcher);
}

export const xRangePlugin: SeriesPlugin<XRangeSeries> = {
    type: 'x-range',
    prepareSeries: prepareXRangeSeries,
    // Use bar duration (x1 - x0) as the color value so that longer bars can be
    // visually distinguished by color intensity.
    getColorValue: (d) => Math.abs(Number(d.x1) - Number(d.x0)),
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
