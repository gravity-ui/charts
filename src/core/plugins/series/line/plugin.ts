import type {LineSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedLineSeries} from '../../../series/types';
import type {ShapePoint} from '../../../utils/tooltip-helpers';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareLineData} from './prepare-data';
import {prepareLineSeries} from './prepare-series';
import {renderLine} from './renderer';
import type {PreparedLineData} from './types';
import {getSeriesClipPathId} from './utils';

const b = block('line');

const lineShapeConfig: ShapeConfig = {
    refs: [
        {key: 'plot', className: b(), withClipPath: true},
        {key: 'markers'},
        {key: 'hoverMarkers'},
        {key: 'annotations'},
    ],
    render({nodes, preparedData, seriesOptions, boundsWidth, boundsHeight, dispatcher}) {
        return renderLine(
            {
                plot: nodes.plot,
                markers: nodes.markers,
                hoverMarkers: nodes.hoverMarkers,
                annotations: nodes.annotations,
                boundsWidth,
                boundsHeight,
            },
            preparedData as PreparedLineData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedLineData[]).flatMap((d) => d.htmlLabels);
    },
};

export const linePlugin: SeriesPlugin = {
    type: 'line',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareLineSeries({
            series: series as LineSeries[],
            seriesOptions,
            legend,
            colorScale,
        });
    },

    async prepareShapeData({
        chartSeries,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
        zoomState,
        otherLayers,
        clipPathId,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareLineData({
            series: chartSeries as PreparedLineSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
            otherLayers,
        });

        const resultClipPathId = getSeriesClipPathId({clipPathId, yAxis, zoomState});

        return {
            data: preparedData,
            shapesData: preparedData,
            layers: preparedData,
            clipPathId: resultClipPathId,
        };
    },

    getTooltipData({shapesData}: TooltipDataArgs): TooltipDataResult {
        const points = (shapesData as PreparedLineData[]).reduce<ShapePoint[]>((acc, d) => {
            for (const p of d.points) {
                if (p.y !== null && p.x !== null && !p.hiddenInLine) {
                    acc.push({
                        data: p.data,
                        series: p.series as LineSeries,
                        x: p.x,
                        y0: p.y,
                        y1: p.y,
                    });
                }
            }
            return acc;
        }, []);
        return {chunks: [], pointsForXAxisLookup: points};
    },

    shape: lineShapeConfig,
};
