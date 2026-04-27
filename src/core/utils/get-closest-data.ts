import groupBy from 'lodash/groupBy';

import type {ShapeData} from '../../hooks/useShapes';
import type {TooltipDataChunk} from '../../types';
import {pluginRegistry} from '../plugins';

import {getClosestPointsByXValue} from './tooltip-helpers';
import type {ShapePoint} from './tooltip-helpers';

type GetClosestPointsArgs = {
    position: [number, number];
    shapesData: ShapeData[];
    boundsHeight: number;
    boundsWidth: number;
};

export type {ShapePoint};

export function getClosestPoints(args: GetClosestPointsArgs): TooltipDataChunk[] {
    const {position, shapesData, boundsHeight, boundsWidth} = args;
    const result: TooltipDataChunk[] = [];
    const groups = groupBy(shapesData, (d) => d.type);
    const pointsForXAxisLookup: ShapePoint[] = [];

    Object.entries(groups).forEach(([seriesType, list]) => {
        const plugin = pluginRegistry.get(seriesType);
        if (!plugin) {
            return;
        }

        const {chunks, pointsForXAxisLookup: xPoints} = plugin.getTooltipData({
            shapesData: list,
            position,
            boundsWidth,
            boundsHeight,
        });
        result.push(...chunks);
        if (xPoints) {
            pointsForXAxisLookup.push(...xPoints);
        }
    });

    if (pointsForXAxisLookup.length) {
        result.push(
            ...(getClosestPointsByXValue(
                position[0],
                position[1],
                pointsForXAxisLookup,
            ) as TooltipDataChunk[]),
        );
    }

    return result;
}
