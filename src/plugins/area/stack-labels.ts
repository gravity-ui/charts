import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '~core/series/plugin';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {sumDecimals} from '~core/utils/math';

import type {AreaSeriesData} from '../../types';
import {getStackLabelValue} from '../stack-labels';
import type {StackLabelAnchor} from '../stack-labels';
import {resolveStackLabelsOptions} from '../stack-labels-options';

const DEFAULT_POSITIVE_EXTENDS_UP = true;

interface Boundary {
    y: number;
}

interface StackBoundary {
    points: AreaSeriesData[];
    options: StackLabelAnchor['options'];
    x: number;
    extendsUp: boolean;
    plotIndex: number;
    prev?: Boundary;
    next?: Boundary;
    hasPositiveBoundary?: boolean;
}

interface StackAtX {
    boundariesBySign: Map<boolean, StackBoundary>;
    allSignsPoints?: AreaSeriesData[];
}

function getOuterBoundary(stack?: StackBoundary) {
    if (!stack?.prev || !stack.next) return stack?.prev ?? stack?.next;

    const nextIsOuter = stack.extendsUp ? stack.next.y < stack.prev.y : stack.next.y > stack.prev.y;
    return nextIsOuter ? stack.next : stack.prev;
}

function createAnchor(
    stack: StackBoundary,
    boundary: Boundary,
    points: AreaSeriesData[],
    total: number,
): StackLabelAnchor {
    return {
        options: stack.options,
        x: stack.x,
        y: boundary.y,
        total: getStackLabelValue(stack.options, points, total),
        plotIndex: stack.plotIndex,
        direction: stack.extendsUp ? 'top' : 'bottom',
    };
}

function getAllSignsAnchor(
    boundariesBySign: StackAtX['boundariesBySign'],
    points: AreaSeriesData[],
) {
    const positive = boundariesBySign.get(false);
    const negative = boundariesBySign.get(true);
    const positiveBoundary = getOuterBoundary(positive);
    const negativeBoundary = getOuterBoundary(negative);
    const useNegative = !positive?.hasPositiveBoundary && Boolean(negativeBoundary);
    const stack = useNegative ? negative : positive;
    const boundary = useNegative ? negativeBoundary : positiveBoundary;
    if (!stack || !boundary) return undefined;

    return createAnchor(
        stack,
        boundary,
        points,
        sumDecimals(points.map((point) => Number(point.y))),
    );
}

export function getAreaStackLabelAnchors(data: PreparedAreaData[], args: PrepareShapeDataArgs) {
    const stacks = new Map<string, StackAtX>();
    for (const item of data) {
        if (!item.series.stacking) continue;
        const options = resolveStackLabelsOptions(
            args.seriesOptions.area?.stackLabels,
            item.series.stackLabels,
        );
        if (!options.enabled) continue;
        const range = args.yScale?.[item.series.yAxis]?.range();
        const positiveExtendsUp = range
            ? range[0] > range[range.length - 1]
            : DEFAULT_POSITIVE_EXTENDS_UP;
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
            let stackAtX = stacks.get(key);
            if (!stackAtX) {
                stackAtX = {
                    boundariesBySign: new Map(),
                    allSignsPoints: options.mode === 'allSigns' ? [] : undefined,
                };
                stacks.set(key, stackAtX);
            }
            const {boundariesBySign, allSignsPoints} = stackAtX;
            let stack = boundariesBySign.get(negative);
            if (!stack) {
                stack = {
                    points: [],
                    options,
                    x: point.x,
                    extendsUp: negative ? !positiveExtendsUp : positiveExtendsUp,
                    plotIndex: args.yAxis?.[item.series.yAxis]?.plotIndex ?? 0,
                };
                boundariesBySign.set(negative, stack);
            }
            const contributingPoints = allSignsPoints ?? stack.points;
            contributingPoints.push(point.data);

            for (const side of ['prev', 'next'] as const) {
                const neighbor = pointsByX[index + (side === 'prev' ? -1 : 1)]?.[0];
                // Explicit nulls open a gap; synthetic missing points are zero-height sections.
                if (neighbor?.data.y === null && item.series.nullMode !== 'zero') continue;
                const boundaryPoint = side === 'prev' ? point : points[points.length - 1];
                if (boundaryPoint.y === null) continue;
                if (allSignsPoints && value > 0) stack.hasPositiveBoundary = true;
                const boundary = stack[side];
                if (boundary) {
                    boundary.y = (stack.extendsUp ? Math.min : Math.max)(
                        boundary.y,
                        boundaryPoint.y,
                    );
                } else {
                    stack[side] = {y: boundaryPoint.y};
                }
            }
        });
    }

    const anchors: StackLabelAnchor[] = [];
    for (const {boundariesBySign, allSignsPoints} of stacks.values()) {
        if (allSignsPoints) {
            const anchor = getAllSignsAnchor(boundariesBySign, allSignsPoints);
            if (anchor) anchors.push(anchor);
            continue;
        }

        for (const stack of boundariesBySign.values()) {
            const boundary = getOuterBoundary(stack);
            if (!boundary) continue;
            const total = sumDecimals(stack.points.map((point) => Number(point.y)));
            // Zero segments do not add a separate total beside a negative stack.
            if (total === 0 && boundariesBySign.has(true)) continue;
            anchors.push(createAnchor(stack, boundary, stack.points, total));
        }
    }
    return anchors;
}
