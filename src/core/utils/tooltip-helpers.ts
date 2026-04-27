import {bisector, sort} from 'd3-array';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {ChartSeries, ChartSeriesData} from '../../types';

export type ShapePoint = {
    x: number;
    y0: number;
    y1: number;
    data: ChartSeriesData;
    series: ChartSeries;
    subTotal?: number;
    sourceX?: number;
};

export function getClosestYIndex(items: ShapePoint[], y: number) {
    let closestYIndex = -1;
    if (y < items[0]?.y0) {
        closestYIndex = 0;
    } else if (y > items[items.length - 1]?.y1) {
        closestYIndex = items.length - 1;
    } else {
        closestYIndex = items.findIndex((p) => y > p.y0 && y < p.y1);
        if (closestYIndex === -1) {
            const sortedY = sort(
                items.map((p, index) => ({index, y: p.y1 + (p.y0 - p.y1) / 2})),
                (p) => p.y,
            );
            const sortedYIndex = bisector<{y: number}, number>((p) => p.y).center(sortedY, y);
            closestYIndex = sortedY[sortedYIndex]?.index ?? -1;
        }
    }

    return closestYIndex;
}

export function getClosestPointsByXValue(x: number, y: number, points: ShapePoint[]) {
    const sorted = sort(points, (p) => p.x);
    const closestXIndex = bisector<ShapePoint, number>((p) => p.x).center(sorted, x);

    if (sorted.length === 0 || closestXIndex === -1) {
        return [];
    }

    const closestX = Math.round(sorted[closestXIndex].x);
    const filtered = points.filter((p) => Math.round(p.x) === closestX);

    const groupedBySeries = Object.values(groupBy(filtered, (p) => get(p.series, 'id'))).map(
        (items) => {
            const sortedByY = sort(items, (p) => p.y0);
            const index = getClosestYIndex(sortedByY, y);
            return sortedByY[index === -1 ? 0 : index];
        },
    );

    const closestPoints = sort(
        groupedBySeries.filter((p): p is ShapePoint => p !== undefined),
        (p) => p.y0,
    );

    const pointsWithSourceX = closestPoints.filter((p) => p.sourceX !== undefined);
    const uniqueSourceX = new Set(pointsWithSourceX.map((p) => p.sourceX));

    if (pointsWithSourceX.length > 1 && uniqueSourceX.size > 1) {
        const sortedBySourceX = sort(pointsWithSourceX, (p) => p.sourceX ?? 0);
        const closestSourceXIdx = bisector<ShapePoint, number>((p) => p.sourceX ?? 0).center(
            sortedBySourceX,
            x,
        );
        const closestSourceX = sortedBySourceX[closestSourceXIdx]?.sourceX;

        const candidates = closestPoints.filter(
            (p) => p.sourceX === undefined || p.sourceX === closestSourceX,
        );
        const sortedCandidates = sort(candidates, (p) => p.y0);
        const winnerIdx = getClosestYIndex(sortedCandidates, y);
        const winner = sortedCandidates[winnerIdx === -1 ? 0 : winnerIdx];

        return closestPoints.map((p) => ({
            ...p,
            closest: p === winner,
        }));
    }

    const closestYIndex = getClosestYIndex(closestPoints, y);
    return closestPoints.map((p, i) => ({
        ...p,
        closest: i === closestYIndex,
    }));
}

export function isInsidePath(args: {
    path: string;
    point: [number, number];
    width: number;
    height: number;
    strokeWidth: number;
}) {
    const {path, point, width, height, strokeWidth} = args;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.lineWidth = strokeWidth;
        const path2D = new Path2D(path);
        ctx.stroke(path2D);
        return ctx.isPointInPath(path2D, ...point) || ctx.isPointInStroke(path2D, ...point);
    }

    return null;
}

export function getRadius(args: {pointer: [number, number]; center: [number, number]}) {
    const {pointer, center} = args;
    const x = pointer[0] - center[0];
    const y = pointer[1] - center[1];
    return Math.sqrt(x * x + y * y);
}
