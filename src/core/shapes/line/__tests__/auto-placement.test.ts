import {curveLinear, curveMonotoneX} from 'd3-shape';

import type {PlacementBounds, PlacementSegment} from '../auto-placement';
import {
    DEFAULT_PLACEMENT_ORDER,
    clampPlacementRect,
    getLineSegments,
    getPlacementPositions,
    pickLabelPlacement,
    segmentIntersectsRect,
} from '../auto-placement';
import type {PointData} from '../types';

describe('getPlacementPositions', () => {
    it('expands "auto" into the built-in order', () => {
        expect(getPlacementPositions('auto')).toBe(DEFAULT_PLACEMENT_ORDER);
        expect(DEFAULT_PLACEMENT_ORDER).toEqual(['top', 'bottom', 'left', 'right']);
    });

    it('passes an explicit array through', () => {
        expect(getPlacementPositions(['bottom', 'top'])).toEqual(['bottom', 'top']);
    });
});

function makeSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    halfWidth = 0,
): PlacementSegment {
    return {
        halfWidth,
        x1,
        x2,
        xMax: Math.max(x1, x2),
        xMin: Math.min(x1, x2),
        y1,
        y2,
        yMax: Math.max(y1, y2),
        yMin: Math.min(y1, y2),
    };
}

function makePoint(x: number | null, y: number | null, hiddenInLine?: boolean): PointData {
    return {x, y, hiddenInLine, data: {}, series: {}} as PointData;
}

describe('segmentIntersectsRect', () => {
    const rect = {height: 10, width: 20, x: 10, y: 10};

    it('segment passing through the rect -> true', () => {
        expect(segmentIntersectsRect(makeSegment(0, 15, 40, 15), rect)).toBe(true);
    });

    it('segment with an endpoint inside the rect -> true', () => {
        expect(segmentIntersectsRect(makeSegment(0, 0, 15, 15), rect)).toBe(true);
    });

    it('segment far away (bbox reject) -> false', () => {
        expect(segmentIntersectsRect(makeSegment(100, 100, 200, 200), rect)).toBe(false);
    });

    it('segment outside the rect but within halfWidth -> true', () => {
        // Horizontal segment 3px below the rect bottom edge (y = 20)
        const seg = makeSegment(0, 23, 40, 23, 4);
        expect(segmentIntersectsRect(seg, rect)).toBe(true);
    });

    it('segment outside the rect and beyond halfWidth -> false', () => {
        const seg = makeSegment(0, 23, 40, 23, 2);
        expect(segmentIntersectsRect(seg, rect)).toBe(false);
    });

    it('vertical segment crossing the rect -> true', () => {
        expect(segmentIntersectsRect(makeSegment(15, 0, 15, 40), rect)).toBe(true);
    });

    it('vertical segment beside the rect -> false', () => {
        expect(segmentIntersectsRect(makeSegment(5, 0, 5, 40), rect)).toBe(false);
    });

    it('horizontal segment above the rect -> false', () => {
        expect(segmentIntersectsRect(makeSegment(0, 5, 40, 5), rect)).toBe(false);
    });

    it('diagonal segment crossing only a corner -> true', () => {
        // Passes through the top-left corner area of the rect
        expect(segmentIntersectsRect(makeSegment(0, 25, 25, 0), rect)).toBe(true);
    });

    it('diagonal segment whose bbox overlaps but the line misses the rect -> false', () => {
        // bbox [28..45]x[0..17] overlaps the rect, but the line y = x - 28
        // passes above-right of the rect corner (30, 10)
        expect(segmentIntersectsRect(makeSegment(28, 0, 45, 17), rect)).toBe(false);
    });
});

describe('pickLabelPlacement', () => {
    const bounds: PlacementBounds = {xMax: 200, yBottom: 200, yTop: 0};
    const point = {x: 100, y: 100};
    const size = {height: 10, width: 20};
    const padding = 5;
    const baseArgs = {
        allowOverlap: false,
        bounds,
        obstacles: [],
        positions: ['top', 'bottom', 'right', 'left'] as const,
        padding,
        point,
        segments: [],
        size,
    };

    it('picks the first position from order when it is free', () => {
        const rect = pickLabelPlacement({...baseArgs, positions: [...baseArgs.positions]});
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: 85});
    });

    it('falls back to the next position when the first one crosses a line', () => {
        // Horizontal line crossing the top candidate (y range 85..95)
        const segments = [makeSegment(0, 88, 200, 88)];
        const rect = pickLabelPlacement({
            ...baseArgs,
            positions: [...baseArgs.positions],
            segments,
        });
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: 105});
    });

    it('respects a custom order', () => {
        const rect = pickLabelPlacement({...baseArgs, positions: ['right']});
        expect(rect).toEqual({height: 10, width: 20, x: 105, y: 95});
    });

    it('returns null when every candidate is occupied', () => {
        const obstacles = [{height: 200, width: 200, x: 0, y: 0}];
        const rect = pickLabelPlacement({
            ...baseArgs,
            positions: [...baseArgs.positions],
            obstacles,
        });
        expect(rect).toBeNull();
    });

    it('allowOverlap skips the obstacle check', () => {
        const obstacles = [{height: 200, width: 200, x: 0, y: 0}];
        const rect = pickLabelPlacement({
            ...baseArgs,
            allowOverlap: true,
            obstacles,
            positions: [...baseArgs.positions],
        });
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: 85});
    });

    it('allowOverlap does not skip the line check', () => {
        const obstacles = [{height: 200, width: 200, x: 0, y: 0}];
        // Line crossing the top candidate: bottom is picked despite the obstacle
        const segments = [makeSegment(0, 88, 200, 88)];
        const rect = pickLabelPlacement({
            ...baseArgs,
            allowOverlap: true,
            obstacles,
            positions: [...baseArgs.positions],
            segments,
        });
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: 105});
    });

    it('shifts an edge candidate into the plot instead of rejecting it', () => {
        // The first (top) candidate sticks out of the plot horizontally; it is
        // clamped and, being free of collisions, wins
        const leftRect = pickLabelPlacement({
            ...baseArgs,
            positions: [...baseArgs.positions],
            point: {x: 5, y: 100},
        });
        expect(leftRect).toEqual({height: 10, width: 20, x: 0, y: 85});

        const rightRect = pickLabelPlacement({
            ...baseArgs,
            positions: [...baseArgs.positions],
            point: {x: 195, y: 100},
        });
        expect(rightRect).toEqual({height: 10, width: 20, x: 180, y: 85});
    });

    it('clamps candidates crossing the top and bottom bounds', () => {
        const topRect = pickLabelPlacement({
            ...baseArgs,
            positions: ['top'],
            point: {x: 100, y: 10},
        });
        expect(topRect).toEqual({height: 10, width: 20, x: 90, y: 0});

        const bottomRect = pickLabelPlacement({
            ...baseArgs,
            positions: ['bottom'],
            point: {x: 100, y: 190},
        });
        expect(bottomRect).toEqual({height: 10, width: 20, x: 90, y: 190});
    });

    it('rejects a clamped candidate that lands on a line', () => {
        // The top candidate of a point near the plot top is clamped down onto
        // the horizontal line: the label goes to the bottom position instead
        const segments = [makeSegment(0, 3, 200, 3)];
        const rect = pickLabelPlacement({
            ...baseArgs,
            positions: ['top', 'bottom'],
            point: {x: 100, y: 10},
            segments,
        });
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: 15});
    });

    it('clamps the svg candidate by the hanging baseline', () => {
        const rect = pickLabelPlacement({
            ...baseArgs,
            hangingOffset: 2,
            positions: ['top'],
            point: {x: 100, y: 10},
        });
        expect(rect).toEqual({height: 10, width: 20, x: 90, y: -2});
    });
});

describe('clampPlacementRect', () => {
    const bounds: PlacementBounds = {xMax: 200, yBottom: 100, yTop: 0};

    it('is an identity for a rect inside the bounds', () => {
        const rect = {height: 10, width: 20, x: 50, y: 40};
        expect(clampPlacementRect({bounds, rect})).toEqual(rect);
    });

    it('clamps the left and right edges by x', () => {
        expect(clampPlacementRect({bounds, rect: {height: 10, width: 20, x: -5, y: 40}})).toEqual({
            height: 10,
            width: 20,
            x: 0,
            y: 40,
        });
        expect(clampPlacementRect({bounds, rect: {height: 10, width: 20, x: 190, y: 40}})).toEqual({
            height: 10,
            width: 20,
            x: 180,
            y: 40,
        });
    });

    it('lets the right limit win when the rect is wider than the plot', () => {
        // mirrors the legacy Math.min(xMax - width, Math.max(0, x)) operation order
        const rect = clampPlacementRect({bounds, rect: {height: 10, width: 250, x: 10, y: 40}});
        expect(rect.x).toBe(-50);
    });

    it('clamps the top edge by the hanging baseline for svg labels', () => {
        // the visible top may stick out above the plot by hangingOffset, as in the
        // legacy Math.max(yAxisTop, ... + hangingOffset) formula
        const rect = clampPlacementRect({
            bounds,
            hangingOffset: 2,
            rect: {height: 10, width: 20, x: 50, y: -8},
        });
        expect(rect.y).toBe(-2);
    });

    it('clamps the top edge by the box for html labels', () => {
        const rect = clampPlacementRect({bounds, rect: {height: 10, width: 20, x: 50, y: -8}});
        expect(rect.y).toBe(0);
    });

    it('clamps the bottom edge', () => {
        const rect = clampPlacementRect({bounds, rect: {height: 10, width: 20, x: 50, y: 95}});
        expect(rect.y).toBe(90);
    });
});

describe('getLineSegments with a curve', () => {
    const points = [makePoint(0, 100), makePoint(50, 0), makePoint(100, 100)];

    it('produces the same chords for the linear curve', () => {
        const chords = getLineSegments([{lineWidth: 2, points}]);
        const linear = getLineSegments([{curveFactory: curveLinear, lineWidth: 2, points}]);
        expect(linear).toEqual(chords);
    });

    it('flattens an interpolated curve into segments that follow it', () => {
        const segments = getLineSegments([{curveFactory: curveMonotoneX, lineWidth: 2, points}]);
        // 2 Bézier pieces, 8 straight segments each
        expect(segments).toHaveLength(16);
        expect([segments[0].x1, segments[0].y1]).toEqual([0, 100]);
        expect([segments[15].x2, segments[15].y2]).toEqual([100, 100]);
        // Every piece is continuous with the previous one and keeps the stroke width
        for (let i = 1; i < segments.length; i++) {
            expect([segments[i].x1, segments[i].y1]).toEqual([
                segments[i - 1].x2,
                segments[i - 1].y2,
            ]);
            expect(segments[i].halfWidth).toBe(1);
        }
        // The monotone curve passes through the middle data point
        expect(segments[7].x2).toBeCloseTo(50);
        expect(segments[7].y2).toBeCloseTo(0);
    });

    it('keeps the gaps of the line', () => {
        const segments = getLineSegments([
            {
                curveFactory: curveMonotoneX,
                lineWidth: 2,
                points: [
                    makePoint(0, 0),
                    makePoint(10, 10),
                    makePoint(20, null),
                    makePoint(30, 30),
                    makePoint(40, 40),
                ],
            },
        ]);
        const jumps = segments.filter(
            (s, i) => i > 0 && (s.x1 !== segments[i - 1].x2 || s.y1 !== segments[i - 1].y2),
        );
        // Two separate sub-paths: exactly one discontinuity between them
        expect(jumps).toHaveLength(1);
    });
});

describe('getLineSegments', () => {
    it('builds segments for adjacent drawn points and precomputes the bbox', () => {
        const segments = getLineSegments([
            {lineWidth: 4, points: [makePoint(0, 10), makePoint(10, 0), makePoint(20, 5)]},
        ]);
        expect(segments).toEqual([
            {halfWidth: 2, x1: 0, x2: 10, xMax: 10, xMin: 0, y1: 10, y2: 0, yMax: 10, yMin: 0},
            {halfWidth: 2, x1: 10, x2: 20, xMax: 20, xMin: 10, y1: 0, y2: 5, yMax: 5, yMin: 0},
        ]);
    });

    it('breaks the line at a null point', () => {
        const segments = getLineSegments([
            {
                lineWidth: 2,
                points: [
                    makePoint(0, 0),
                    makePoint(10, null),
                    makePoint(20, 20),
                    makePoint(30, 30),
                ],
            },
        ]);
        expect(segments).toEqual([
            {halfWidth: 1, x1: 20, x2: 30, xMax: 30, xMin: 20, y1: 20, y2: 30, yMax: 30, yMin: 20},
        ]);
    });

    it('breaks the line at a hiddenInLine point', () => {
        const segments = getLineSegments([
            {
                lineWidth: 2,
                points: [
                    makePoint(0, 0),
                    makePoint(10, 10, true),
                    makePoint(20, 20),
                    makePoint(30, 30),
                ],
            },
        ]);
        expect(segments).toEqual([
            {halfWidth: 1, x1: 20, x2: 30, xMax: 30, xMin: 20, y1: 20, y2: 30, yMax: 30, yMin: 20},
        ]);
    });
});
