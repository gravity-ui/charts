import type {AreaSeries} from '../../../../types';
import {block} from '../../../../utils';
import type {PreparedAreaSeries} from '../../../series/types';
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

import {prepareAreaData} from './prepare-data';
import {prepareArea} from './prepare-series';
import {renderArea} from './renderer';
import type {PreparedAreaData} from './types';

const b = block('area');

const areaShapeConfig: ShapeConfig = {
    refs: [
        {key: 'plot', className: b(), withClipPath: true},
        {key: 'markers'},
        {key: 'hoverMarkers'},
        {key: 'annotations'},
    ],
    render({nodes, preparedData, seriesOptions, boundsWidth, boundsHeight, dispatcher}) {
        return renderArea(
            {
                plot: nodes.plot,
                markers: nodes.markers,
                hoverMarkers: nodes.hoverMarkers,
                annotations: nodes.annotations,
                boundsWidth,
                boundsHeight,
            },
            preparedData as PreparedAreaData[],
            seriesOptions,
            dispatcher,
        );
    },
    getHtmlElements(preparedData) {
        const data = preparedData as PreparedAreaData[];
        const items = data.flatMap((d) => d.htmlLabels);
        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        return allowOverlap ? items : filterOverlappingLabels(items);
    },
};

export const areaPlugin: SeriesPlugin = {
    type: 'area',

    prepareSeries({series, seriesOptions, legend, colorScale}: SeriesPluginPrepareArgs) {
        return prepareArea({
            series: series as AreaSeries[],
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
    }: SeriesPluginShapeArgs): Promise<SeriesPluginShapeResult | null> {
        if (!xAxis || !xScale || !yScale?.length) {
            return null;
        }

        const preparedData = await prepareAreaData({
            series: chartSeries as PreparedAreaSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
        });

        return {data: preparedData, shapesData: preparedData, layers: preparedData};
    },

    getTooltipData({shapesData}: TooltipDataArgs): TooltipDataResult {
        const points = (shapesData as PreparedAreaData[]).reduce<ShapePoint[]>((acc, d) => {
            for (const p of d.points) {
                if (p.y === null || p.hiddenInLine) {
                    continue;
                }
                acc.push({
                    data: p.data,
                    series: p.series as AreaSeries,
                    x: p.x,
                    y0: p.y0,
                    y1: p.y,
                });
            }
            return acc;
        }, []);
        return {chunks: [], pointsForXAxisLookup: points};
    },

    shape: areaShapeConfig,
};
