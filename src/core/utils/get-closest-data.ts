import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {TooltipDataChunk} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {TooltipItemData} from '../shapes/types';

import {getClosestPointsByXValue, isPointTooltipEnabled} from './tooltip-helpers';
import type {ShapePoint, TooltipCandidate} from './tooltip-helpers';

interface GetClosestPointsArgs {
    position: [number, number];
    shapesData: TooltipItemData[];
    boundsHeight: number;
    boundsWidth: number;
    /** Index of the render layer of each series by series id; a higher index is drawn above. */
    layerIndexes: Map<string, number>;
}

interface Contender {
    chunk: TooltipCandidate;
    distance?: number;
    layer: number;
}

function getSeriesType(shapeData: TooltipItemData) {
    return (
        get(shapeData, 'series.type') ||
        get(shapeData, 'point.series.type') ||
        get(shapeData, 'type')
    );
}

export type {ShapePoint} from './tooltip-helpers';

function getLayer(layerIndexes: Map<string, number>, series: object) {
    return layerIndexes.get(get(series, 'id', '')) ?? -1;
}

function isCloser(distance: number | undefined, layer: number, other: Contender) {
    if (distance === undefined) {
        return false;
    }
    if (other.distance === undefined) {
        return true;
    }
    return distance < other.distance || (distance === other.distance && layer > other.layer);
}

/**
 * Keeps a single active chunk: every series type marks its own closest chunk, so the one
 * whose shape is nearest to the pointer wins. On equal distance the series drawn in the upper
 * layer wins, then the first one.
 */
function resolveClosest(candidates: TooltipCandidate[], contenders: Contender[]) {
    let winner: Contender | undefined;
    for (const contender of contenders) {
        if (!winner || isCloser(contender.distance, contender.layer, winner)) {
            winner = contender;
        }
    }

    if (winner && !candidates.includes(winner.chunk)) {
        const index = candidates.findIndex(
            (chunk) => get(chunk.series, 'id') === get(winner.chunk.series, 'id'),
        );
        if (index === -1) {
            candidates.push(winner.chunk);
        } else {
            candidates[index] = winner.chunk;
        }
    }

    return candidates.map((candidate) => {
        const {distance: _distance, ...chunk} = candidate;
        return {...chunk, closest: candidate === winner?.chunk};
    });
}

export function getClosestPoints(args: GetClosestPointsArgs): TooltipDataChunk[] {
    const {position, shapesData, boundsHeight, boundsWidth, layerIndexes} = args;
    const [pointerX, pointerY] = position;

    const result: TooltipCandidate[] = [];
    const contenders: Contender[] = [];
    const xLookupPoints: ShapePoint[] = [];
    const groups = groupBy(shapesData, getSeriesType);
    // With a single series type there is nothing to arbitrate between.
    const measureDistance = Object.keys(groups).length > 1;

    for (const [seriesType, list] of Object.entries(groups)) {
        let plugin;
        try {
            plugin = getSeriesPlugin(seriesType);
        } catch {
            continue;
        }

        const {chunks, xLookupPoints: seriesXLookupPoints} = plugin.tooltip.prepareData({
            data: list,
            position,
            boundsWidth,
            boundsHeight,
            measureDistance,
        });

        for (const chunk of chunks) {
            if (!isPointTooltipEnabled(chunk)) {
                continue;
            }
            result.push(chunk);
            if (chunk.closest) {
                contenders.push({
                    chunk,
                    distance: chunk.distance,
                    layer: getLayer(layerIndexes, chunk.series),
                });
            }
        }
        if (seriesXLookupPoints) {
            for (const p of seriesXLookupPoints) {
                if (isPointTooltipEnabled(p)) {
                    xLookupPoints.push(p);
                }
            }
        }
    }

    if (xLookupPoints.length) {
        const chunks = getClosestPointsByXValue(pointerX, pointerY, xLookupPoints);
        result.push(...chunks);
        const lookupGroups = measureDistance
            ? Object.values(groupBy(xLookupPoints, (point) => get(point.series, 'id')))
            : [xLookupPoints];
        for (const points of lookupGroups) {
            const closest = getClosestPointsByXValue(pointerX, pointerY, points).find(
                (chunk) => chunk.closest,
            );
            if (closest) {
                contenders.push({
                    chunk: closest,
                    distance: closest.distance,
                    layer: getLayer(layerIndexes, closest.series),
                });
            }
        }
    }

    return resolveClosest(result, contenders);
}
