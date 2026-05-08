import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {TooltipDataChunk} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {TooltipItemData} from '../shapes/types';

import {getClosestPointsByXValue} from './tooltip-helpers';
import type {ShapePoint} from './tooltip-helpers';

type GetClosestPointsArgs = {
    position: [number, number];
    shapesData: TooltipItemData[];
    boundsHeight: number;
    boundsWidth: number;
};

function getSeriesType(shapeData: TooltipItemData) {
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
        let plugin;
        try {
            plugin = getSeriesPlugin(seriesType);
        } catch {
            continue;
        }

        const {chunks, xLookupPoints: seriesXLookupPoints} = plugin.getTooltipData({
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
