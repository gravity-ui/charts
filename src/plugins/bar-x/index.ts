import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import {getStackedDomainValues} from '~core/series/stacked-domain';
import type {PreparedBarXSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/bar-x/get-tooltip-data';
import {prepareBarXData} from '~core/shapes/bar-x/prepare-data';
import {renderBarX} from '~core/shapes/bar-x/renderer';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {getTooltipColorSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import {filterLayerLabels} from '~core/utils';
import {
    validateAxisPlotValues,
    validatePercentStackingValues,
    validateStacking,
    validateXYSeries,
} from '~core/validation/helpers';

import type {BarXFormatContext, BarXSeries, TooltipDataChunkBarX} from '../../types';
import {getBarDomainData} from '../bar-domain';
import {validateBarGrouping} from '../bar-grouping';
import {validateBarLabelPlacement} from '../bar-label-placement';
import {validateBarOpacity} from '../bar-opacity';
import {validateBarMaxWidth, validateBarPadding} from '../bar-sizing';
import {prepareStackLabels, renderStackLabels} from '../stack-labels';
import {validateStackLabelsOptions} from '../stack-labels-options';

import {getTargetElements, prepareNearestData} from './interaction';
import {prepareBarXSeries} from './prepare-bar-x-series';
import {getBarXStackLabelAnchors} from './stack-labels';

async function prepareShapeData(args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight,
        boundsWidth,
        split,
        isRangeSlider,
        otherLayers = [],
    } = args;

    if (!xAxis || !xScale || !yScale?.length || !split) {
        return {renderData: [], tooltipItems: []};
    }

    const data = await prepareBarXData({
        series: series as PreparedBarXSeries[],
        seriesOptions,
        xAxis,
        xScale,
        yAxis: yAxis ?? [],
        yScale,
        boundsHeight,
        boundsWidth,
        split,
        isRangeSlider,
    });

    const filteredData = filterLayerLabels(data, otherLayers);
    const labels = await prepareStackLabels({
        ...args,
        anchors: isRangeSlider ? [] : getBarXStackLabelAnchors(data, args),
        otherLayers: [...otherLayers, ...filteredData],
    });
    return {renderData: filteredData, tooltipItems: filteredData, labels};
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    labels,
    seriesOptions,
    boundsWidth,
    boundsHeight,
    dispatcher,
}: RenderShapesArgs) {
    const data = preparedData as PreparedBarXData[];
    const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
    const cleanup = renderBarX(
        {plot, labelsPlot, boundsWidth, boundsHeight},
        data,
        seriesOptions,
        allowOverlap,
        dispatcher,
    );
    renderStackLabels(labelsPlot, labels);
    return cleanup;
}

export const barXPlugin: SeriesPlugin<BarXSeries, TooltipDataChunkBarX, BarXFormatContext> = {
    type: 'bar-x',
    axisBaseline: 'y',
    isAxisDomainFixed: ({series, axis}) => axis === 'y' && series.stacking === 'percent',
    zoom: {types: ['x', 'xy'], defaultType: 'x'},
    prepareSeries: prepareBarXSeries,
    validate: ({series, allSeries, seriesOptions, xAxis, yAxis}) => {
        validateBarLabelPlacement(series.dataLabels);
        validateBarPadding(series.barPadding);
        validateBarMaxWidth(series.barMaxWidth);
        validateBarOpacity(series.opacity, 'opacity');
        validateBarOpacity(seriesOptions?.['bar-x']?.opacity, 'series.options.bar-x.opacity');
        series.data.forEach((point, index) => {
            validateBarOpacity(point.opacity, `data[${index}].opacity`);
        });
        validateStackLabelsOptions({
            series,
            allSeries,
            options: seriesOptions?.['bar-x']?.stackLabels,
        });
        validateAxisPlotValues({series, xAxis, yAxis});
        validateXYSeries({series, xAxis, yAxis});
        validateStacking({series});
        validateBarGrouping({series, allSeries});
        validatePercentStackingValues({
            series,
            valueKey: 'y',
            valueAxisType: yAxis?.[series.yAxis ?? 0]?.type,
        });
    },
    getAxisDomainValues: ({series, axis}) =>
        axis === 'y'
            ? getStackedDomainValues({
                  series,
                  categoryKey: 'x',
                  valueKey: 'y',
                  getData: (item) => getBarDomainData(item, 'x', 'y'),
              })
            : undefined,
    getColorValue: (d) => d.y,
    prepareShapeData,
    renderShapes,
    interaction: {
        prepareNearestData,
        getTargetElements,
    },
    tooltip: {
        prepareData: getTooltipData,
        getValue: getTooltipYValue,
        header: {getValue: getTooltipXValue, axis: 'x'},
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
                        formatValue: ({item, value}) => {
                            const {data, series} = item as TooltipDataChunkBarX;
                            return getTooltipColorSymbol({
                                color: String(value),
                                opacity: data.opacity ?? series.opacity ?? 1,
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
