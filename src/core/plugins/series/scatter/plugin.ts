import {Delaunay} from 'd3-delaunay';

import type {ScatterSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedScatterSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareScatterData} from './prepare-data';
import {prepareScatterSeries} from './prepare-series';
import {renderScatter} from './renderer';
import type {PreparedScatterData, PreparedScatterShapeData} from './types';

const b = block('scatter');

const scatterShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b(), withClipPath: true}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderScatter(
            {plot: nodes.plot},
            preparedData as PreparedScatterShapeData,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedScatterShapeData).htmlLabels;
    },
};

export const scatterPlugin: SeriesPlugin = {
    type: 'scatter',

    prepareSeries({series, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareScatterSeries({series: series as ScatterSeries[], legend, colorScale});
    },

    async prepareShapeData({
        chartSeries,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareScatterData({
            series: chartSeries as PreparedScatterSeries[],
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
        });

        return {data: preparedData, shapesData: preparedData.markers};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const points = shapesData as PreparedScatterData[];
        const delaunay = Delaunay.from(
            points,
            (d) => d.point.x,
            (d) => d.point.y,
        );
        const closestPoint = points[delaunay.find(pointerX, pointerY)];
        if (!closestPoint) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestPoint.point.data,
                    series: closestPoint.point.series,
                    closest: true,
                },
            ],
        };
    },

    shape: scatterShapeConfig,
};
