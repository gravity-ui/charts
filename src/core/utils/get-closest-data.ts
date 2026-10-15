import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {ChartInteractionItem, TooltipDataChunk} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {TooltipItemData} from '../shapes/types';

import {toPublicInteractionItem} from './chart-interaction';
import {getNearestItem} from './nearest-point';
import {getClosestPointsByXValue, getSeriesLayer, isPointTooltipEnabled} from './tooltip-helpers';
import type {LayerIndexes, ShapePoint, TooltipCandidate} from './tooltip-helpers';

interface GetClosestPointsArgs {
    position: [number, number];
    shapesData: TooltipItemData[];
    boundsHeight: number;
    boundsWidth: number;
    /** Render layer of each series; without it the ties are resolved by the first candidate. */
    layerIndexes?: LayerIndexes;
}

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

function getContender(
    chunk: TooltipCandidate,
    distance: number | undefined,
    layerIndexes: LayerIndexes,
): Contender {
    return {
        chunk,
        distance: distance ?? Infinity,
        layer: getSeriesLayer(layerIndexes, chunk.series),
    };
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
    const {position, shapesData, boundsHeight, boundsWidth, layerIndexes = new Map()} = args;
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
        const chunks = getClosestPointsByXValue(pointerX, pointerY, xLookupPoints, layerIndexes);
        let winner = chunks.find((chunk) => chunk.closest);
        let contender = winner
            ? getContender(winner as TooltipCandidate, winner.distance, layerIndexes)
            : undefined;

        // A series on another X grid has no point in the column, but its shape may still be
        // the nearest one: it then joins with the point nearest to the pointer on its own grid.
        const columnSeries = new Set<string>(chunks.map((chunk) => get(chunk.series, 'id', '')));
        for (const [id, points] of Object.entries(
            groupBy(xLookupPoints, (p) => get(p.series, 'id', '')),
        )) {
            const {distance} = points[0];
            if (columnSeries.has(id) || distance === undefined) {
                continue;
            }
            const layer = getSeriesLayer(layerIndexes, points[0].series);
            if (contender && !isCloser({chunk: contender.chunk, distance, layer}, contender)) {
                continue;
            }
            const own = getClosestPointsByXValue(pointerX, pointerY, points).find((p) => p.closest);
            if (own) {
                winner = own;
                contender = getContender(own as TooltipCandidate, distance, layerIndexes);
            }
        }

        // The chunks are fresh copies, so the flag can be set in place and the contender
        // keeps pointing at the same object.
        for (const chunk of chunks) {
            chunk.closest = chunk === winner;
            result.push(chunk as TooltipCandidate);
        }
        if (winner && !chunks.includes(winner)) {
            result.push(winner as TooltipCandidate);
        }
        if (contender) {
            contenders.push(contender);
        }
    }

    return resolveClosest(result, contenders);
}

interface GetChartClosestArgs extends GetClosestPointsArgs {
    mode: 'chart' | 'tooltip';
    seriesOrder: string[];
}

export function getChartClosest(args: GetChartClosestArgs): ChartInteractionItem | null {
    if (args.mode === 'chart') {
        const candidates = Object.entries(groupBy(args.shapesData, getSeriesType)).flatMap(
            ([seriesType, data]) => {
                const plugin = getSeriesPlugin(seriesType);
                return (
                    plugin.interaction?.prepareNearestData({
                        data,
                        position: args.position,
                        boundsWidth: args.boundsWidth,
                        boundsHeight: args.boundsHeight,
                    }) ?? []
                );
            },
        );
        const nearest = getNearestItem(args.position, candidates, args.seriesOrder);
        return nearest ? toPublicInteractionItem(nearest) : null;
    }
    // Use the same candidate selection and eligibility as the tooltip in this mode.
    const selected = getClosestPoints(args).find((item) => item.closest);
    if (!selected) return null;
    const plugin = getSeriesPlugin(selected.series.type);
    return toPublicInteractionItem(
        plugin.interaction?.getClosestItem?.(selected) ??
            ({
                point: selected.data,
                series: selected.series,
            } as ChartInteractionItem),
    );
}
