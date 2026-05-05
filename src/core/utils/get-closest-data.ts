import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {ShapeData} from '../../hooks/useShapes';
import type {TooltipDataChunk} from '../../types';
import {getTooltipData as areaGetTooltipData} from '../shapes/area/get-tooltip-data';
import {getTooltipData as barXGetTooltipData} from '../shapes/bar-x/get-tooltip-data';
import {getTooltipData as barYGetTooltipData} from '../shapes/bar-y/get-tooltip-data';
import {getTooltipData as funnelGetTooltipData} from '../shapes/funnel/get-tooltip-data';
import {getTooltipData as heatmapGetTooltipData} from '../shapes/heatmap/get-tooltip-data';
import {getTooltipData as lineGetTooltipData} from '../shapes/line/get-tooltip-data';
import {getTooltipData as pieGetTooltipData} from '../shapes/pie/get-tooltip-data';
import {getTooltipData as radarGetTooltipData} from '../shapes/radar/get-tooltip-data';
import {getTooltipData as sankeyGetTooltipData} from '../shapes/sankey/get-tooltip-data';
import {getTooltipData as scatterGetTooltipData} from '../shapes/scatter/get-tooltip-data';
import {getTooltipData as treemapGetTooltipData} from '../shapes/treemap/get-tooltip-data';
import {getTooltipData as waterfallGetTooltipData} from '../shapes/waterfall/get-tooltip-data';
import {getTooltipData as xRangeGetTooltipData} from '../shapes/x-range/get-tooltip-data';

import {getClosestPointsByXValue} from './tooltip-helpers';
import type {GetTooltipDataFn, ShapePoint} from './tooltip-helpers';

type GetClosestPointsArgs = {
    position: [number, number];
    shapesData: ShapeData[];
    boundsHeight: number;
    boundsWidth: number;
};

const tooltipFnByType: Record<string, GetTooltipDataFn> = {
    line: lineGetTooltipData,
    area: areaGetTooltipData,
    'bar-x': barXGetTooltipData,
    'bar-y': barYGetTooltipData,
    waterfall: waterfallGetTooltipData,
    scatter: scatterGetTooltipData,
    pie: pieGetTooltipData,
    treemap: treemapGetTooltipData,
    heatmap: heatmapGetTooltipData,
    sankey: sankeyGetTooltipData,
    radar: radarGetTooltipData,
    funnel: funnelGetTooltipData,
    'x-range': xRangeGetTooltipData,
};

function getSeriesType(shapeData: ShapeData) {
    return (
        get(shapeData, 'series.type') ||
        get(shapeData, 'point.series.type') ||
        get(shapeData, 'type')
    );
}

export type {ShapePoint} from './tooltip-helpers';

export function getClosestPoints(args: GetClosestPointsArgs): TooltipDataChunk[] {
    const {position, shapesData, boundsHeight, boundsWidth} = args;
    const [pointerX, pointerY] = position;

    const result: TooltipDataChunk[] = [];
    const xLookupPoints: ShapePoint[] = [];
    const groups = groupBy(shapesData, getSeriesType);

    for (const [seriesType, list] of Object.entries(groups)) {
        const fn = tooltipFnByType[seriesType];
        if (!fn) {
            continue;
        }

        const {chunks, xLookupPoints: seriesXLookupPoints} = fn({
            data: list,
            position,
            boundsWidth,
            boundsHeight,
        });

        result.push(...chunks);
        if (seriesXLookupPoints) {
            xLookupPoints.push(...seriesXLookupPoints);
        }
    }

    if (xLookupPoints.length) {
        result.push(
            ...(getClosestPointsByXValue(pointerX, pointerY, xLookupPoints) as TooltipDataChunk[]),
        );
    }

    return result;
}
