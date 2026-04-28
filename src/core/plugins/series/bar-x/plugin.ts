import groupBy from 'lodash/groupBy';

import type {BarXSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedBarXSeries} from '../../../series/types';
import {filterOverlappingLabels} from '../../../utils';
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

import {prepareBarXData} from './prepare-data';
import {prepareBarXSeries} from './prepare-series';
import {renderBarX} from './renderer';
import type {PreparedBarXData} from './types';

const b = block('bar-x');

const barXShapeConfig: ShapeConfig = {
    refs: [{key: 'plot', className: b(), withClipPath: true}, {key: 'annotations'}],
    render({nodes, preparedData, seriesOptions, boundsWidth, boundsHeight, dispatcher}) {
        return renderBarX(
            {
                plot: nodes.plot,
                annotations: nodes.annotations,
                boundsWidth,
                boundsHeight,
            },
            preparedData as PreparedBarXData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        const data = preparedData as PreparedBarXData[];
        const items = data.flatMap((d) => d.htmlLabels);
        const allowOverlap = data.some((d) => d?.series.dataLabels.allowOverlap);
        return allowOverlap ? items : filterOverlappingLabels(items);
    },
};

export const barXPlugin: SeriesPlugin = {
    type: 'bar-x',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareBarXSeries({
            series: series as BarXSeries[],
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
        split,
        isRangeSlider,
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareBarXData({
            series: chartSeries as PreparedBarXSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
            boundsHeight,
            split,
            isRangeSlider,
        });

        return {data: preparedData, shapesData: preparedData, layers: preparedData};
    },

    getTooltipData({shapesData}: TooltipDataArgs): TooltipDataResult {
        const barXList = shapesData as PreparedBarXData[];
        const barXGroups = groupBy(barXList, (d) => String(d.data.x));
        const points: ShapePoint[] = [];
        Object.values(barXGroups).forEach((group) => {
            const groupCenterX =
                group.reduce((sum, d) => sum + d.x + d.width / 2, 0) / group.length;
            group.forEach((d) => {
                points.push({
                    data: d.data,
                    series: d.series as BarXSeries,
                    x: groupCenterX,
                    y0: d.y,
                    y1: d.y + d.height,
                    sourceX: d.x + d.width / 2,
                });
            });
        });
        return {chunks: [], pointsForXAxisLookup: points};
    },

    shape: barXShapeConfig,
};
