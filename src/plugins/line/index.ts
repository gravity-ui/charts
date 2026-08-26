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
import {
    validateAxisPlotValues,
    validateSeriesColor,
    validateXYSeries,
} from '~core/validation/helpers';

import type {LineSeries, TooltipDataChunkLine} from '../../types';

import {getCurveFactory} from './interpolation';
import {prepareLineSeries} from './prepare-line-series';
import {validateInterpolation} from './validation';

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
    return renderLine(
        {plot, getCurveFactory},
        preparedData as PreparedLineData[],
        seriesOptions,
        dispatcher,
    );
}

export const linePlugin: SeriesPlugin<LineSeries> = {
    type: 'line',
    prepareSeries: prepareLineSeries,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({series, xAxis, yAxis});
        validateInterpolation({series});
        validateSeriesColor({color: series.color, seriesName: series.name});
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
                            const lineItem = item as TooltipDataChunkLine;
                            const s = lineItem.series as PreparedLineSeries;
                            return getTooltipLineSymbol({
                                color: lineItem.color ?? s.color,
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
