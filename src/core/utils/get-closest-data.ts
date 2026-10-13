import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import omit from 'lodash/omit';

import type {TooltipDataChunk} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {TooltipItemData} from '../shapes/types';

import {getClosestPointsByXValue, isPointTooltipEnabled} from './tooltip-helpers';
import type {ShapePoint, TooltipCandidate} from './tooltip-helpers';

type GetClosestPointsArgs = {
    position: [number, number];
    shapesData: TooltipItemData[];
    boundsHeight: number;
    boundsWidth: number;
    /** Index of the render layer of each series by series id; a higher index is drawn above. */
    layerIndexes: Map<string, number>;
};

interface Contender {
    chunk: TooltipCandidate;
    distance: number;
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

function isCloser(distance: number, layer: number, other: Contender) {
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

    return candidates.map((candidate) => {
        const chunk = omit(candidate, 'distance') as TooltipDataChunk;
        return candidate.closest && candidate !== winner?.chunk
            ? {...chunk, closest: false}
            : chunk;
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
        result.push(...(chunks as TooltipCandidate[]));
        const closest = chunks.find((chunk) => chunk.closest);
        if (closest) {
            // The lookup picks a point by its X column, not by the shape under the pointer,
            // so it competes with the nearest lookup shape.
            const nearest: Contender = {
                chunk: closest as TooltipCandidate,
                distance: Infinity,
                layer: -1,
            };
            for (const p of xLookupPoints) {
                const layer = getLayer(layerIndexes, p.series);
                if (isCloser(p.distance, layer, nearest)) {
                    nearest.distance = p.distance;
                    nearest.layer = layer;
                }
            }
            contenders.push(nearest);
        }
    }

    return resolveClosest(result, contenders);
}
