import type {TreemapSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedTreemapSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareTreemapData} from './prepare-data';
import {prepareTreemap} from './prepare-series';
import {renderTreemap} from './renderer';
import type {PreparedTreemapData} from './types';

const b = block('treemap');

const treemapShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderTreemap(
            {plot: nodes.plot},
            preparedData as PreparedTreemapData,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedTreemapData).htmlElements;
    },
};

export const treemapPlugin: SeriesPlugin = {
    type: 'treemap',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareTreemap({
            series: series as TreemapSeries[],
            seriesOptions,
            legend,
            colorScale,
        });
    },

    async prepareShapeData({
        chartSeries,
        boundsWidth,
        boundsHeight,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult> {
        const preparedData = await prepareTreemapData({
            series: chartSeries[0] as PreparedTreemapSeries,
            width: boundsWidth,
            height: boundsHeight,
        });

        return {data: preparedData, shapesData: [preparedData]};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const [data] = shapesData as PreparedTreemapData[];
        const closestPoint = data?.leaves.find(
            (l) => pointerX >= l.x0 && pointerX <= l.x1 && pointerY >= l.y0 && pointerY <= l.y1,
        );
        if (!closestPoint) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestPoint.data,
                    series: data.series as unknown as TreemapSeries,
                    closest: true,
                },
            ],
        };
    },

    shape: treemapShapeConfig,
};
