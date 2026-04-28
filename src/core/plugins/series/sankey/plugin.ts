import type {SankeySeries, SankeySeriesData} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedSankeySeries} from '../../../series/types';
import {isInsidePath} from '../../../utils/tooltip-helpers';
import type {ShapeConfig} from '../shared/types';
import type {
    SeriesPlugin,
    SeriesPluginPrepareArgs,
    SeriesPluginShapeArgs,
    SeriesPluginShapeResult,
    TooltipDataArgs,
    TooltipDataResult,
} from '../types';

import {prepareSankeyData} from './prepare-data';
import {prepareSankeySeries} from './prepare-series';
import {renderSankey} from './renderer';
import type {PreparedSankeyData} from './types';

const b = block('sankey');

const sankeyShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b()}],
    render({nodes, preparedData, seriesOptions, dispatcher}) {
        return renderSankey(
            {plot: nodes.plot},
            preparedData as PreparedSankeyData,
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        return (preparedData as PreparedSankeyData).htmlElements;
    },
};

export const sankeyPlugin: SeriesPlugin = {
    type: 'sankey',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareSankeySeries({
            series: series as SankeySeries[],
            seriesOptions,
            colorScale,
            legend,
        });
    },

    prepareShapeData({
        chartSeries,
        boundsWidth,
        boundsHeight,
    }: SeriesPluginShapeArgs): SeriesPluginShapeResult {
        const preparedData = prepareSankeyData({
            series: chartSeries[0] as PreparedSankeySeries,
            width: boundsWidth,
            height: boundsHeight,
        });

        return {data: preparedData, shapesData: [preparedData]};
    },

    getTooltipData({
        shapesData,
        position,
        boundsWidth,
        boundsHeight,
    }: TooltipDataArgs): TooltipDataResult {
        const [data] = shapesData as PreparedSankeyData[];
        if (!data) {
            return {chunks: []};
        }
        const closestLink = data.links.find((d) => {
            return isInsidePath({
                path: d.path ?? '',
                strokeWidth: d.strokeWidth,
                point: position,
                width: boundsWidth,
                height: boundsHeight,
            });
        });
        if (!closestLink) {
            return {chunks: []};
        }
        return {
            chunks: [
                {
                    data: closestLink.source as SankeySeriesData,
                    target: closestLink.target as SankeySeriesData,
                    series: data.series as unknown as SankeySeries,
                    closest: true,
                },
            ],
        };
    },

    shape: sankeyShapeConfig,
};
