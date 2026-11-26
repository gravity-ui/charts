import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedLineSeries} from '~core/series/types';
import {getTooltipLineSymbol, getTooltipXValue, getTooltipYValue} from '~core/tooltip/utils';
import {filterLayerLabels} from '~core/utils';
import {createGradientGeometryPreparer, getGradientGeometry} from '~core/utils/gradient-geometry';
import {
    validateAxisPlotValues,
    validateSeriesColor,
    validateXYSeries,
} from '~core/validation/helpers';

import type {LineSeries, TooltipDataChunkLine} from '../../types';
import {getCurveFactory} from '../interpolation';
import {validateInterpolation} from '../interpolation/validation';

import {getLineAxisPadding} from './axis-padding';
import {getTooltipData} from './get-tooltip-data';
import {getTargetElements, prepareNearestData} from './interaction';
import {prepareLineData, projectLineData} from './prepare-data';
import {prepareLineSeries} from './prepare-line-series';
import {renderLine} from './renderer';
import type {PreparedLineData} from './types';
import {validateLabelAnchor} from './validation';
import {filterLineData, getLineAxisData} from './zoom';

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
        allSeries,
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
        otherLayers,
        allSeries,
        getCurveFactory,
    });

    const filteredData = filterLayerLabels(data, otherLayers ?? []);
    return {
        renderData: filteredData,
        tooltipItems: filteredData,
        gradientGeometry: getGradientGeometry(filteredData),
    };
}

function renderShapes({
    plot,
    labelsPlot,
    preparedData,
    seriesOptions,
    dispatcher,
}: RenderShapesArgs) {
    return renderLine(
        {plot, labelsPlot, getCurveFactory},
        preparedData as PreparedLineData[],
        seriesOptions,
        dispatcher,
    );
}

export const linePlugin: SeriesPlugin<LineSeries> = {
    type: 'line',
    axes: {
        x: {singleValueDomain: 'center'},
        y: {singleValueDomain: 'center', getData: getLineAxisData},
    },
    getAxisPadding: getLineAxisPadding,
    getLayerKey: ({seriesKey}) => seriesKey,
    getClipPath: ({isRangeSlider, yAxis, zoomState}) => {
        if (isRangeSlider) return 'bounds';
        const hasMinOrMax = yAxis.some(
            (axis) => typeof axis?.min === 'number' || typeof axis?.max === 'number',
        );
        const hasZoom = zoomState && Object.keys(zoomState).length > 0;
        return hasZoom || hasMinOrMax ? 'bounds' : 'horizontal';
    },
    zoom: {
        types: ['x', 'xy', 'y'],
        defaultType: 'x',
        filterData: filterLineData,
    },
    prepareGradientGeometry: createGradientGeometryPreparer(projectLineData),
    prepareSeries: prepareLineSeries,
    validate: ({series, xAxis, yAxis}) => {
        validateAxisPlotValues({series, xAxis, yAxis});
        validateInterpolation({series});
        validateLabelAnchor({series});
        validateSeriesColor({color: series.color, seriesName: series.name});
        validateXYSeries({series, xAxis, yAxis});
    },
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
        // The line symbol needs the series stroke options, which a `format` formatter cannot
        // reach on its own — so the rows are built per chunk and close over them. `source` stays
        // a plain value lookup, which is what a custom `rowRenderer` receives as `color`.
        rows: (chunk) => {
            const s = (chunk as TooltipDataChunkLine).series as PreparedLineSeries;

            return [
                {
                    id: 'default',
                    cells: [
                        {
                            id: 'color',
                            source: 'color',
                            format: {
                                type: 'custom',
                                formatter: ({value}) =>
                                    getTooltipLineSymbol({
                                        color: String(value),
                                        dashStyle: s.dashStyle,
                                        lineWidth: s.lineWidth,
                                    }),
                            },
                            width: '16px',
                        },
                        {id: 'name', source: 'name', align: 'start'},
                        {id: 'value', source: 'data.y', align: 'end'},
                    ],
                },
            ];
        },
    },
};
