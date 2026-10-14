import type {ChartInteractionItem, PointPosition} from '../../types';

import type {ShapePoint} from './tooltip-helpers';

export interface PrepareNearestDataArgs<TShapeData = unknown> {
    data: TShapeData[];
}

/** A plugin-owned reference position in plot-relative pixels. */
export interface NearestCandidate {
    position: PointPosition;
    item: ChartInteractionItem;
}

/** Reuse unfiltered axis-point preparation without its X-first tooltip selection. */
export function getPointCandidates(points: ShapePoint[]): NearestCandidate[] {
    return points.map((point) => ({
        position: [point.sourceX ?? point.x, (point.y0 + point.y1) / 2],
        item: {point: point.data, series: point.series} as ChartInteractionItem,
    }));
}

/** Compare every candidate in the same pixel metric, independently of plugin iteration order. */
export function getNearestItem(
    position: PointPosition,
    candidates: NearestCandidate[],
    seriesOrder: string[],
): ChartInteractionItem | null {
    const order = new Map(seriesOrder.map((id, index) => [id, index]));
    let nearest: ChartInteractionItem | null = null;
    let minDistance = Infinity;
    let nearestOrder = Infinity;
    for (const candidate of candidates) {
        const distance = Math.hypot(
            position[0] - candidate.position[0],
            position[1] - candidate.position[1],
        );
        if (!Number.isFinite(distance)) continue;
        const candidateOrder = order.get(candidate.item.series.id) ?? Infinity;
        if (distance < minDistance || (distance === minDistance && candidateOrder < nearestOrder)) {
            nearest = candidate.item;
            minDistance = distance;
            nearestOrder = candidateOrder;
        }
    }
    return nearest;
}
