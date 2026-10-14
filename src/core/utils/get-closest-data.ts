import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

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
    /** Distance to the drawn shape; `Infinity` when the plugin did not measure it. */
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

function getContender(
    chunk: TooltipCandidate,
    distance: number | undefined,
    layerIndexes: Map<string, number>,
): Contender {
    return {chunk, distance: distance ?? Infinity, layer: getLayer(layerIndexes, chunk.series)};
}

function isCloser(contender: Contender, other: Contender) {
    return (
        contender.distance < other.distance ||
        (contender.distance === other.distance && contender.layer > other.layer)
    );
}

/**
 * Keeps a single active chunk: every series type marks its own closest chunk, so the one
 * whose shape is nearest to the pointer wins. An unmeasured distance loses to any measured
 * one. On equal distance the series drawn in the upper layer wins, then the first one.
 */
function resolveClosest(candidates: TooltipCandidate[], contenders: Contender[]) {
    let winner: Contender | undefined;
    for (const contender of contenders) {
        if (!winner || isCloser(contender, winner)) {
            winner = contender;
        }
    }

    return candidates.map((candidate): TooltipDataChunk => {
        const {distance: _distance, ...chunk} = candidate;
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
                contenders.push(getContender(chunk, chunk.distance, layerIndexes));
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
        // The lookup picks the point of the nearest shape in the X column (see
        // `getClosestPointsByXValue`), so it competes with the distance of its own series.
        const chunks = getClosestPointsByXValue(pointerX, pointerY, xLookupPoints);
        for (const chunk of chunks) {
            const candidate = chunk as TooltipCandidate;
            result.push(candidate);
            if (chunk.closest) {
                contenders.push(getContender(candidate, chunk.distance, layerIndexes));
            }
        }
    }

    return resolveClosest(result, contenders);
}
