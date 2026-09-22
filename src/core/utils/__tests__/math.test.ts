import {calculateNumericProperty, parseNumericProperty, sumDecimals} from '../math';

describe('calculateNumericProperty', () => {
    test.each([
        {value: 0, expected: 0},
        {value: -25, expected: -25},
        {value: Number.MIN_VALUE, expected: Number.MIN_VALUE},
        {value: Number.MAX_VALUE, expected: Number.MAX_VALUE},
        {value: NaN, expected: NaN},
        {value: Infinity, expected: Infinity},
        {value: -Infinity, expected: -Infinity},
        {value: '25px', expected: 25},
        {value: '.5px', expected: 0.5},
        {value: '-25px', expected: -25},
        {value: '25%', base: 200, expected: 50},
        {value: '-25%', base: 200, expected: -50},
        {value: '25%', base: 0, expected: 0},
        {value: '25%', expected: undefined},
        {value: '25.5.5px', expected: 25.5},
        {value: '25.5.5%', base: 200, expected: 51},
        {value: ' 25px', expected: 25},
        {value: '1e2px', expected: 100},
        {value: 'Infinitypx', expected: Infinity},
        {value: '25px foo', expected: undefined},
        {value: '25', expected: undefined},
        {value: '25em', expected: undefined},
        {value: 'NaNpx', expected: undefined},
        {value: '', expected: undefined},
        {value: null, expected: undefined},
        {value: undefined, expected: undefined},
    ])('preserves existing conversion behavior (%j)', ({value, base, expected}) => {
        expect(calculateNumericProperty({value, base})).toBe(expected);
    });
});

describe('parseNumericProperty', () => {
    test.each([
        {value: '12.5%', expected: 12.5},
        {value: `${'9'.repeat(308)}%`, expected: 1e308},
        {value: `0.${'0'.repeat(323)}5%`, expected: Number.MIN_VALUE},
    ])('preserves percentage magnitudes before scaling (%j)', ({value, expected}) => {
        expect(parseNumericProperty(value)).toEqual({value: expected, unit: '%'});
    });
});

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
