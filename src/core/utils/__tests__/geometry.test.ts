import {
    getDistanceToBand,
    getDistanceToPolygon,
    getDistanceToRect,
    getDistanceToSegment,
} from '../geometry';

describe('getDistanceToSegment', () => {
    test.each<[[number, number], number]>([
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

describe('getDistanceToRect', () => {
    test.each<[[number, number], number]>([
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

describe('getDistanceToPolygon', () => {
    const vertices: [number, number][] = [
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

describe('getDistanceToBand', () => {
    const columns = [
        {x: 0, y0: 100, y1: 0},
        {x: 10, y0: 100, y1: 50},
        null,
        {x: 30, y0: 100, y1: 0},
    ];

    test('returns zero inside the interpolated band', () => {
        expect(getDistanceToBand({point: [5, 30], columns})).toBe(0);
    });

    test('measures outside the band', () => {
        expect(getDistanceToBand({point: [-5, 50], columns})).toBe(5);
    });

    test('does not fill across a gap', () => {
        expect(getDistanceToBand({point: [20, 80], columns})).toBe(10);
    });

    test('does not fill an isolated column', () => {
        expect(getDistanceToBand({point: [30, 50], columns: [columns[3]]})).toBe(Infinity);
    });

    test('does not fill a band with zero height', () => {
        expect(
            getDistanceToBand({
                point: [5, 0],
                columns: [
                    {x: 0, y0: 0, y1: 0},
                    {x: 10, y0: 0, y1: 0},
                ],
            }),
        ).toBe(Infinity);
    });
});
