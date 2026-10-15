import {
    getDistanceToPolygon,
    getDistanceToRect,
    getDistanceToRoundedRect,
    getDistanceToSegment,
    getDistanceToStrokedPolyline,
    getDistanceToStrokedSegment,
    offsetConvexPolygon,
} from '../geometry';
import type {Point} from '../geometry';

describe('getDistanceToSegment', () => {
    test.each<[Point, number]>([
        [[5, 3], 3],
        [[-3, 4], 5],
        [[13, 4], 5],
    ])('measures from %j', (point, expected) => {
        expect(getDistanceToSegment({point, start: [0, 0], end: [10, 0]})).toBeCloseTo(expected);
    });

    test('handles a zero-length segment', () => {
        expect(getDistanceToSegment({point: [3, 4], start: [0, 0], end: [0, 0]})).toBe(5);
    });
});

describe('getDistanceToStrokedSegment', () => {
    const segment = {start: [100, 0] as Point, end: [200, 0] as Point, halfWidth: 10};

    test('returns zero inside the stroke body', () => {
        expect(
            getDistanceToStrokedSegment({
                ...segment,
                point: [150, 9],
                startCap: 'butt',
                endCap: 'butt',
            }),
        ).toBe(0);
    });

    test.each<['butt' | 'round' | 'square', number]>([
        ['butt', 5],
        ['round', 0],
        ['square', 0],
    ])('applies the %s cap beyond the segment end', (cap, expected) => {
        const point: Point = [205, 0];
        expect(getDistanceToStrokedSegment({...segment, point, startCap: cap, endCap: cap})).toBe(
            expected,
        );
    });

    test('rounds the corner of a round cap and squares the corner of a square cap', () => {
        const point: Point = [209, 9];
        expect(
            getDistanceToStrokedSegment({...segment, point, startCap: 'round', endCap: 'round'}),
        ).toBeCloseTo(Math.hypot(9, 9) - 10);
        expect(
            getDistanceToStrokedSegment({...segment, point, startCap: 'square', endCap: 'square'}),
        ).toBe(0);
    });

    test('paints a zero-length segment only with its caps', () => {
        const dot = {start: [0, 0] as Point, end: [0, 0] as Point, halfWidth: 10};
        expect(
            getDistanceToStrokedSegment({
                ...dot,
                point: [5, 5],
                startCap: 'round',
                endCap: 'round',
            }),
        ).toBe(0);
        expect(
            getDistanceToStrokedSegment({
                ...dot,
                point: [9, 9],
                startCap: 'square',
                endCap: 'square',
            }),
        ).toBe(0);
        expect(
            getDistanceToStrokedSegment({...dot, point: [3, 4], startCap: 'butt', endCap: 'butt'}),
        ).toBe(Infinity);
    });
});

describe('getDistanceToStrokedPolyline', () => {
    const vertices: Point[] = [
        [0, 0],
        [100, 0],
        [100, 100],
    ];

    test('applies the cap only at the ends of the polyline', () => {
        const args = {vertices, halfWidth: 10, linecap: 'butt' as const};
        expect(getDistanceToStrokedPolyline({...args, point: [-5, 0]})).toBe(5);
        expect(getDistanceToStrokedPolyline({...args, point: [100, 105]})).toBe(5);
        // The join between the segments is round.
        expect(getDistanceToStrokedPolyline({...args, point: [108, -8]})).toBeCloseTo(
            Math.hypot(8, 8) - 10,
        );
    });

    test('measures a single vertex by its cap', () => {
        expect(
            getDistanceToStrokedPolyline({
                point: [8, 0],
                vertices: [[0, 0]],
                halfWidth: 10,
                linecap: 'round',
            }),
        ).toBe(0);
        expect(
            getDistanceToStrokedPolyline({
                point: [8, 0],
                vertices: [[0, 0]],
                halfWidth: 10,
                linecap: 'butt',
            }),
        ).toBe(Infinity);
    });
});

describe('getDistanceToRect', () => {
    test.each<[Point, number]>([
        [[5, 5], 0],
        [[15, 5], 5],
        [[13, 14], 5],
    ])('measures from %j', (point, expected) => {
        expect(getDistanceToRect({point, x: 0, y: 0, width: 10, height: 10})).toBeCloseTo(expected);
    });

    test('supports a negative height', () => {
        expect(getDistanceToRect({point: [5, -5], x: 0, y: 0, width: 10, height: -10})).toBe(0);
    });
});

describe('getDistanceToRoundedRect', () => {
    const rect = {x: 0, y: 0, width: 100, height: 50};

    test('matches the plain rectangle without radii', () => {
        const point: Point = [103, 54];
        expect(getDistanceToRoundedRect({...rect, point, borderRadius: [0, 0, 0, 0]})).toBeCloseTo(
            5,
        );
        expect(
            getDistanceToRoundedRect({...rect, point: [50, 25], borderRadius: [0, 0, 0, 0]}),
        ).toBe(0);
    });

    test('cuts out the rounded corners', () => {
        // The top-right corner is rounded by 20px: its center is at (80, 20).
        const args = {...rect, borderRadius: [0, 20, 0, 0] as [number, number, number, number]};
        expect(getDistanceToRoundedRect({...args, point: [99, 1]})).toBeCloseTo(
            Math.hypot(19, 19) - 20,
        );
        expect(getDistanceToRoundedRect({...args, point: [1, 1]})).toBe(0);
        expect(getDistanceToRoundedRect({...args, point: [99, 49]})).toBe(0);
    });

    test('draws corner radii larger than the half height like the renderer does', () => {
        // A 10px high bar with 8px top corners: the arcs reach below the middle of the bar.
        const args = {
            x: 0,
            y: 0,
            width: 40,
            height: 10,
            borderRadius: [8, 8, 0, 0] as [number, number, number, number],
        };
        expect(getDistanceToRoundedRect({...args, point: [39.5, 6]})).toBe(0);
        expect(getDistanceToRoundedRect({...args, point: [39.5, 3]})).toBeGreaterThan(0);
        expect(getDistanceToRoundedRect({...args, point: [32, 0.5]})).toBe(0);
        expect(getDistanceToRoundedRect({...args, point: [39, 1]})).toBeCloseTo(
            Math.hypot(7, 7) - 8,
            1,
        );
    });

    test('supports a negative height', () => {
        expect(
            getDistanceToRoundedRect({
                point: [50, -25],
                x: 0,
                y: 0,
                width: 100,
                height: -50,
                borderRadius: [0, 0, 0, 0],
            }),
        ).toBe(0);
    });
});

describe('getDistanceToPolygon', () => {
    const vertices: Point[] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
    ];

    test('returns zero inside', () => {
        expect(getDistanceToPolygon({point: [5, 5], vertices})).toBe(0);
    });

    test('measures outside to the nearest edge', () => {
        expect(getDistanceToPolygon({point: [5, -4], vertices})).toBe(4);
    });
});

describe('offsetConvexPolygon', () => {
    test('offsets a square with mitered corners regardless of the winding', () => {
        const square: Point[] = [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ];
        const expected = [
            [-2, -2],
            [2, -2],
            [2, 2],
            [-2, 2],
        ];
        expect(offsetConvexPolygon(square, 1)).toEqual(expected);
        expect(offsetConvexPolygon([...square].reverse(), 1)).toEqual([...expected].reverse());
    });

    test('offsets a diamond along its normals', () => {
        const diamond: Point[] = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
        ];
        const [top] = offsetConvexPolygon(diamond, 1);
        expect(top[0]).toBeCloseTo(0);
        expect(top[1]).toBeCloseTo(-1 - Math.SQRT2);
    });
});
