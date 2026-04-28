import {sort} from 'd3-array';

import type {XRangeSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedXRangeSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareXRangeData} from './prepare-data';
import {prepareXRangeSeries} from './prepare-series';
import {renderXRange} from './renderer';
import type {PreparedXRangeData} from './types';

const b = block('x-range');

const xRangeShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b(), withClipPath: true}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderXRange(
            {plot: nodes.plot},
            preparedData as PreparedXRangeData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedXRangeData[]).flatMap((d) => d.htmlLabels);
    },
};

export const xRangePlugin: SeriesPlugin = {
    type: 'x-range',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareXRangeSeries({
            series: series as XRangeSeries[],
            seriesOptions,
            legend,
            colorScale,
        });
    },

    async prepareShapeData({
        chartSeries,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsWidth,
        isRangeSlider,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareXRangeData({
            series: chartSeries as PreparedXRangeSeries[],
            xAxis,
            xScale,
            yAxis,
            yScale,
            boundsWidth,
            isRangeSlider,
        });

        return {data: preparedData, shapesData: preparedData};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const data = shapesData as PreparedXRangeData[];
        const pointsInRange = data.filter(
            (d) =>
                pointerX >= d.x &&
                pointerX <= d.x + d.width &&
                pointerY >= d.y &&
                pointerY <= d.y + d.height,
        );

        if (!pointsInRange.length) {
            return {chunks: []};
        }

        const closestByX =
            pointsInRange.length === 1
                ? pointsInRange[0]
                : sort(pointsInRange, (d) => Math.abs(d.x + d.width / 2 - pointerX))[0];

        return {
            chunks: pointsInRange.map((d) => ({
                data: d.data,
                series: d.series as unknown as XRangeSeries,
                closest: d === closestByX,
            })),
        };
    },

    shape: xRangeShapeConfig,
};
