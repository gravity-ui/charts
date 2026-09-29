import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '~core/series/plugin';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {sumDecimals} from '~core/utils/math';

import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

interface Boundary {
    values: number[];
    y: number;
}

interface StackBoundary {
    options: StackLabelAnchor['options'];
    x: number;
    negative: boolean;
    plotIndex: number;
    prev?: Boundary;
    next?: Boundary;
}

export function getAreaStackLabelAnchors(data: PreparedAreaData[], args: PrepareShapeDataArgs) {
    const stacks = new Map<string, Map<boolean, StackBoundary>>();
    for (const item of data) {
        if (!item.series.stacking) continue;
        const options = resolveStackLabelsOptions(
            args.seriesOptions.area?.stackLabels,
            item.series.stackLabels,
        );
        if (!options.enabled) continue;
        const rawPoints = new Set(item.series.data);
        // A step may have two points at the same X, one for each adjoining section.
        const pointsByX = Array.from(group(item.points, (point) => point.x).values());
        pointsByX.forEach((points, index) => {
            const point = points[0];
            const value = point.data.y;
            if (
                !rawPoints.has(point.data) ||
                typeof value !== 'number' ||
                !Number.isFinite(value)
            ) {
                return;
            }
            const negative = value < 0;
            const key = JSON.stringify([item.series.yAxis, item.series.stackId, point.x]);
            let boundariesBySign = stacks.get(key);
            if (!boundariesBySign) {
                boundariesBySign = new Map();
                stacks.set(key, boundariesBySign);
            }
            let stack = boundariesBySign.get(negative);
            if (!stack) {
                stack = {
                    options,
                    x: point.x,
                    negative,
                    plotIndex: args.yAxis?.[item.series.yAxis]?.plotIndex ?? 0,
                };
                boundariesBySign.set(negative, stack);
            }
            for (const side of ['prev', 'next'] as const) {
                const neighbor = pointsByX[index + (side === 'prev' ? -1 : 1)]?.[0];
                // Explicit nulls open a gap; synthetic missing points are zero-height sections.
                if (neighbor?.data.y === null && item.series.nullMode !== 'zero') continue;
                const boundaryPoint = side === 'prev' ? point : points[points.length - 1];
                if (boundaryPoint.y === null) continue;
                const boundary = stack[side];
                if (boundary) {
                    boundary.values.push(value);
                    boundary.y = (negative ? Math.max : Math.min)(boundary.y, boundaryPoint.y);
                } else {
                    stack[side] = {values: [value], y: boundaryPoint.y};
                }
            }
        });
    }

    const anchors: StackLabelAnchor[] = [];
    for (const boundariesBySign of stacks.values()) {
        for (const stack of boundariesBySign.values()) {
            let boundary = stack.prev ?? stack.next;
            if (stack.prev && stack.next) {
                const nextIsOuter = stack.negative
                    ? stack.next.y > stack.prev.y
                    : stack.next.y < stack.prev.y;
                boundary = nextIsOuter ? stack.next : stack.prev;
            }
            if (!boundary) continue;
            const total = sumDecimals(boundary.values);
            // Zero segments do not add a separate total beside a negative stack.
            if (total === 0 && boundariesBySign.has(true)) continue;
            anchors.push({
                options: stack.options,
                x: stack.x,
                y: boundary.y,
                total,
                plotIndex: stack.plotIndex,
                direction: stack.negative ? 'bottom' : 'top',
            });
        }
    }
    return anchors;
}
