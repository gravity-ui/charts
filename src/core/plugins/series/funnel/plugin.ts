import type {FunnelSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedFunnelSeries} from '../../../series/types';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareFunnelData} from './prepare-data';
import {prepareFunnelSeries} from './prepare-series';
import {renderFunnel} from './renderer';
import type {PreparedFunnelData} from './types';

const b = block('funnel');

const funnelShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderFunnel(
            {plot: nodes.plot},
            preparedData as PreparedFunnelData,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedFunnelData).htmlLabels;
    },
};

export const funnelPlugin: SeriesPlugin = {
    type: 'funnel',

    prepareSeries({series, seriesOptions, legend, colors}: SeriesPluginPrepareArgs) {
        return prepareFunnelSeries({
            series: series[0] as FunnelSeries,
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
        const preparedData = await prepareFunnelData({
            series: chartSeries as PreparedFunnelSeries[],
            boundsWidth,
            boundsHeight,
        });

        return {data: preparedData, shapesData: [preparedData]};
    },

    getTooltipData({
        shapesData,
        position: [pointerX, pointerY],
    }: TooltipDataArgs): TooltipDataResult {
        const [data] = shapesData as PreparedFunnelData[];
        const closestPoint = data?.items.find(
            (item) =>
                pointerX >= item.x &&
                pointerX <= item.x + item.width &&
                pointerY >= item.y &&
                pointerY <= item.y + item.height,
        );
        if (!closestPoint) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestPoint.data,
                    series: closestPoint.series,
                    closest: true,
                },
            ],
        };
    },

    shape: funnelShapeConfig,
};
