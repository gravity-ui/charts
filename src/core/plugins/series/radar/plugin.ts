import {Delaunay} from 'd3-delaunay';

import type {RadarSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedRadarSeries} from '../../../series/types';
import {getRadius, isInsidePath} from '../../../utils/tooltip-helpers';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareRadarData} from './prepare-data';
import {prepareRadarSeries} from './prepare-series';
import {renderRadar} from './renderer';
import type {PreparedRadarData} from './types';

const b = block('radar');

const radarShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderRadar(
            {plot: nodes.plot},
            preparedData as PreparedRadarData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedRadarData[]).flatMap((d) => d.htmlLabels);
    },
};

export const radarPlugin: SeriesPlugin = {
    type: 'radar',

    prepareSeries({series, seriesOptions, legend, colors}: SeriesPluginPrepareArgs) {
        return prepareRadarSeries({
            series: series as RadarSeries[],
            seriesOptions,
            legend,
            colors,
        });
    },

    async prepareShapeData({
        chartSeries,
        boundsWidth,
        boundsHeight,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult> {
        const preparedData = await prepareRadarData({
            series: chartSeries as PreparedRadarSeries[],
            boundsWidth,
            boundsHeight,
        });

        return {data: preparedData, shapesData: preparedData};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
        boundsWidth,
        boundsHeight,
    }: TooltipDataArgs): TooltipDataResult {
        const [radarData] = shapesData as PreparedRadarData[];
        if (!radarData) {
            return {chunks: []};
        }

        const radius = getRadius({center: radarData.center, pointer: [pointerX, pointerY]});
        if (radius > radarData.radius) {
            return {chunks: []};
        }

        const radarShapes = radarData.shapes.filter((shape) =>
            isInsidePath({
                path: shape.path,
                point: [pointerX, pointerY],
                width: boundsWidth,
                height: boundsHeight,
                strokeWidth: shape.borderWidth,
            }),
        );
        const points = radarShapes.flatMap((shape) => shape.points);
        if (!points.length) {
            return {chunks: []};
        }

        const delaunay = Delaunay.from(
            points,
            (d) => d.position[0],
            (d) => d.position[1],
        );
        const closestPoint = points[delaunay.find(pointerX, pointerY)];
        if (!closestPoint) {
            return {chunks: []};
        }

        return {
            chunks: radarData.shapes.map((shape) => ({
                data: shape.points[closestPoint.index].data,
                series: shape.series as unknown as RadarSeries,
                category: shape.series.categories[closestPoint.index],
                closest: shape.series === closestPoint.series,
            })),
        };
    },

    shape: radarShapeConfig,
};
