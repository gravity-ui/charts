import {sumDecimals} from '../math';

describe('sumDecimals', () => {
    test.each<[number[], number]>([
        [[0.2, 0.1], 0.3],
        [[0.1, 0.2, 0.3], 0.6],
        [[0.29, 0.01], 0.3],
        [[-0.2, -0.1], -0.3],
        [[0.3, -0.2, -0.1], 0],
        [[2e-20, 1e-20], 3e-20],
        [[2e-320, 1e-320], 3e-320],
        [[1.000000000000001, 1e-15], 1.000000000000002],
        [[], 0],
    ])('sums %p to %p', (values, expected) => {
        expect(sumDecimals(Object.freeze(values))).toBe(expected);
    });

    test('does not accumulate binary error across many decimal values', () => {
        expect(sumDecimals(Array(1000).fill(0.1))).toBe(100);
    });

    test.each([
        1.2345678901234567,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_VALUE,
        Number.MAX_VALUE,
        0,
        NaN,
        Infinity,
        -Infinity,
    ])('preserves the original value %p', (value) => {
        expect(sumDecimals([value])).toBe(value);
    });

    test('falls back without overflow when scaling would exceed safe integers', () => {
        expect(sumDecimals([1e308, 0.1])).toBe(1e308);
        expect(sumDecimals([Number.MAX_SAFE_INTEGER, 1])).toBe(Number.MAX_SAFE_INTEGER + 1);
        expect(sumDecimals([Infinity, -Infinity])).toBeNaN();
    });
});
