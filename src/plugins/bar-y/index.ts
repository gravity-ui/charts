import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedBarYSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/bar-y/get-tooltip-data';
import {prepareBarYData} from '~core/shapes/bar-y/prepare-data';
import {renderBarY} from '~core/shapes/bar-y/renderer';
import type {BarYShapesArgs} from '~core/shapes/bar-y/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';

import type {BarYFormatContext, BarYSeries, TooltipDataChunkBarY} from '../../types';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';

import {prepareBarYSeries} from './prepare-bar-y-series';
import {getBarYStackLabelAnchors} from './stack-labels';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {series, seriesOptions, xAxis, xScale, yAxis, yScale, boundsHeight, boundsWidth} = args;

    if (!xAxis || !xScale || !yScale?.length) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarYData({
        boundsHeight,
        boundsWidth,
        series: series as PreparedBarYSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
    });

    const labels = await prepareStackLabels({
        ...args,
        anchors: args.isRangeSlider
            ? []
            : getBarYStackLabelAnchors(data.shapes, {xScale, boundsWidth, seriesOptions}),
        otherLayers: [
            ...(args.otherLayers ?? []),
            {svgLabels: data.labels, htmlLabels: data.htmlLabels},
        ],
    });
    return {renderData: [data], tooltipItems: data.shapes, labels};
}

function renderShapes({plot, preparedData, seriesOptions, dispatcher, labels}: RenderShapesArgs) {
    const cleanup = renderBarY(
        {plot},
        preparedData[0] as BarYShapesArgs,
        seriesOptions,
        dispatcher,
    );
    renderStackLabels(plot, labels);
    return cleanup;
}

export const barYPlugin: SeriesPlugin<BarYSeries, TooltipDataChunkBarY, BarYFormatContext> = {
    type: 'bar-y',
    prepareSeries: prepareBarYSeries,
    validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
        validateStackLabelsOptions({
            series,
            allSeries,
            options: seriesOptions?.['bar-y']?.stackLabels,
        });
        validateAxisPlotValues({series, xAxis, yAxis});
        validateXYSeries({series, xAxis, yAxis});
        validateStacking({series});
        validatePercentStackingValues({series, valueKey: 'x', valueAxisType: xAxis?.type});
    },
    getColorValue: (d) => d.x,
    prepareShapeData,
    renderShapes,
    tooltip: {
        prepareData: getTooltipData,
        getValueFormatContext: (item) => {
            return {percentage: item.percentage, data: item.data};
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
                    {id: 'value', source: 'data.x', align: 'end'},
                ],
            },
        ],
    },
};
