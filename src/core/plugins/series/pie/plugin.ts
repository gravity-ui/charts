import type {PieSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedPieSeries} from '../../../series/types';
import {getRadius} from '../../../utils/tooltip-helpers';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {preparePieData} from './prepare-data';
import {preparePieSeries} from './prepare-series';
import {renderPie} from './renderer';
import type {PreparedPieData} from './types';

const b = block('pie');

const pieShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderPie(
            {plot: nodes.plot},
            preparedData as PreparedPieData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedPieData[]).flatMap((d) => d.htmlLabels);
    },
};

export const piePlugin: SeriesPlugin = {
    type: 'pie',

    prepareSeries({series, seriesOptions, legend, colors}: SeriesPluginPrepareArgs) {
        return series.reduce<ReturnType<typeof preparePieSeries>>((acc, singleSeries) => {
            acc.push(
                ...preparePieSeries({
                    series: singleSeries as PieSeries,
                    seriesOptions,
                    legend,
                    colors,
                }),
            );
            return acc;
        }, []);
    },

    async prepareShapeData({
        chartSeries,
        boundsWidth,
        boundsHeight,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult> {
        const preparedData = await preparePieData({
            series: chartSeries as PreparedPieSeries[],
            boundsWidth,
            boundsHeight,
        });

        return {data: preparedData, shapesData: preparedData};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const points = (shapesData as PreparedPieData[]).flatMap((d) => d.segments);
        const closestPoint = points.find((p) => {
            const {center} = p.data.pie;
            const x = pointerX - center[0];
            const y = pointerY - center[1];
            let angle = Math.atan2(y, x) + 0.5 * Math.PI;
            angle = angle < 0 ? Math.PI * 2 + angle : angle;
            const polarRadius = getRadius({center, pointer: [pointerX, pointerY]});
            return angle >= p.startAngle && angle <= p.endAngle && polarRadius < p.data.radius;
        });
        if (!closestPoint) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestPoint.data.series.data,
                    series: closestPoint.data.series,
                    closest: true,
                },
            ],
        };
    },

    shape: pieShapeConfig,
};
