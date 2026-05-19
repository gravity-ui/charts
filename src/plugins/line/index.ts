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

import type {LineSeries} from '../../types';

import {prepareLineSeries} from './prepare-line-series';

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
        otherLayers: otherLayers ?? [],
    });

    return {renderData: data, tooltipItems: data};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
    return renderLine({plot}, preparedData as PreparedLineData[], seriesOptions, dispatcher);
}

export const linePlugin: SeriesPlugin<LineSeries> = {
    type: 'line',
    prepareSeries: prepareLineSeries,
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        row: {
            cells: {
                items: [
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
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        },
    },
};
