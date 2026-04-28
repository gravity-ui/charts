import {bisector, sort} from 'd3-array';

import type {BarYSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedBarYSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareBarYData} from './prepare-data';
import {prepareBarYSeries} from './prepare-series';
import {renderBarY} from './renderer';
import type {BarYShapesArgs, PreparedBarYData} from './types';

const b = block('bar-y');

const barYShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b(), withClipPath: true}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderBarY(
            {plot: nodes.plot},
            preparedData as BarYShapesArgs,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as BarYShapesArgs).htmlElements;
    },
};

export const barYPlugin: SeriesPlugin = {
    type: 'bar-y',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareBarYSeries({
            series: series as BarYSeries[],
            legend,
            colorScale,
            seriesOptions,
        });
    },

    async prepareShapeData({
        chartSeries,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight,
        boundsWidth,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareBarYData({
            series: chartSeries as PreparedBarYSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
            boundsHeight,
            boundsWidth,
        });

        return {data: preparedData, shapesData: preparedData.shapes};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const points = shapesData as PreparedBarYData[];
        const sorted = sort(points, (p) => p.y);
        const closestYIndex = bisector<PreparedBarYData, number>((p) => p.y + p.height / 2).center(
            sorted,
            pointerY,
        );

        const closestYPoint = sorted[closestYIndex];
        if (!closestYPoint) {
            return {chunks: []};
        }

        const selectedPoints = points.filter((p) => p.data.y === closestYPoint.data.y);
        const closestPoints = sort(
            selectedPoints.filter((p) => p.y === closestYPoint.y),
            (p) => p.x,
        );

        let closestPointXValue: number | undefined;
        if (pointerX < closestPoints[0]?.x) {
            closestPointXValue = closestPoints[0].x;
        } else if (
            closestPoints[closestPoints.length - 1] &&
            pointerX >
                closestPoints[closestPoints.length - 1].x +
                    closestPoints[closestPoints.length - 1].width
        ) {
            closestPointXValue = closestPoints[closestPoints.length - 1].x;
        } else {
            closestPointXValue = closestPoints.find(
                (p) => pointerX > p.x && pointerX < p.x + p.width,
            )?.x;
        }

        return {
            chunks: selectedPoints.map((p) => ({
                data: p.data,
                series: p.series as unknown as BarYSeries,
                closest: p.x === closestPointXValue && p.y === closestYPoint?.y,
            })),
        };
    },

    shape: barYShapeConfig,
};
