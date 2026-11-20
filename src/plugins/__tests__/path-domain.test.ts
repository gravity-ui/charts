import {curveCardinal, curveMonotoneX, curveStep, curveStepAfter, curveStepBefore} from 'd3-shape';
import type {CurveFactory} from 'd3-shape';

import type {AxisDomainValue, DomainViewport} from '~core/series/axis-contract';

import {getVisiblePathYValues} from '../path-domain';

const points = [
    {x: 0, y: 20},
    {x: 10, y: 80},
];
const viewport = (range: readonly [number, number]): DomainViewport => ({
    x: {type: 'linear', range},
    y: {type: 'linear'},
});
function extent(values: AxisDomainValue[] | undefined) {
    const numbers = values?.map(Number) ?? [];
    return [Math.min(...numbers), Math.max(...numbers)];
}

test.each<{curveFactory?: CurveFactory; range: [number, number]; expected: number[]}>([
    {range: [2, 4], expected: [32, 44]},
    {curveFactory: curveStepAfter, range: [2, 4], expected: [20, 20]},
    {curveFactory: curveStepBefore, range: [2, 4], expected: [80, 80]},
    {curveFactory: curveStep, range: [4, 6], expected: [20, 80]},
    {curveFactory: curveStep, range: [5, 6], expected: [20, 80]},
    {curveFactory: curveStepAfter, range: [2, 10], expected: [20, 80]},
    {range: [3, 3], expected: [38, 38]},
])('clips the renderer curve to $range', ({curveFactory, range, expected}) => {
    expect(
        extent(getVisiblePathYValues({points, viewport: viewport(range), curveFactory})),
    ).toEqual(expected);
});

test('retains an interior peak and ignores distant anchors', () => {
    expect(
        extent(
            getVisiblePathYValues({
                points: [
                    {x: 0, y: 20},
                    {x: 5, y: 100},
                    {x: 10, y: 80},
                ],
                viewport: viewport([2, 8]),
            }),
        ),
    ).toEqual([52, 100]);
    expect(
        extent(
            getVisiblePathYValues({
                points: [
                    {x: 0, y: 20},
                    {x: 10, y: 1e6},
                ],
                viewport: viewport([2, 4]),
                curveFactory: curveStepAfter,
            }),
        ),
    ).toEqual([20, 20]);
});

test('handles numeric strings, reversed traversal and log coordinates without mutation', () => {
    const data = [
        {x: '10', y: '80'},
        {x: '0', y: '20'},
    ];
    expect(extent(getVisiblePathYValues({points: data, viewport: viewport([2, 4])}))).toEqual([
        32, 44,
    ]);
    expect(data).toEqual([
        {x: '10', y: '80'},
        {x: '0', y: '20'},
    ]);
    const values = getVisiblePathYValues({
        points: [
            {x: 1, y: 1},
            {x: 100, y: 100},
        ],
        viewport: {x: {type: 'logarithmic', range: [10, 10]}, y: {type: 'logarithmic'}},
    });
    expect(values?.length).toBeGreaterThan(0);
    for (const value of values ?? []) {
        expect(Number(value)).toBeCloseTo(10);
    }
});

test('does not bridge gaps, sparse points, or ranges outside the path', () => {
    const sparse = new Array<{x: number; y: number}>(3);
    sparse[0] = points[0];
    sparse[2] = points[1];
    for (const data of [[points[0], {x: 1, y: null}, points[1]], sparse]) {
        expect(getVisiblePathYValues({points: data, viewport: viewport([2, 4])})).toEqual([]);
    }
    expect(getVisiblePathYValues({points, viewport: viewport([11, 12])})).toEqual([]);
    expect(getVisiblePathYValues({points, viewport: viewport([4, 2])})).toEqual([]);
});

test.each([curveMonotoneX, curveCardinal])(
    'clips Bézier domains at window boundaries',
    (curveFactory) => {
        expect(
            extent(getVisiblePathYValues({points, viewport: viewport([2, 4]), curveFactory})),
        ).toEqual([32, 44]);
    },
);

test('includes a cardinal interior extremum with or without an X window', () => {
    const data = [0, 10, 10, 0].map((y, x) => ({x, y}));
    for (const window of [undefined, [0, 3]] as const) {
        expect(
            extent(
                getVisiblePathYValues({
                    points: data,
                    viewport: {...viewport([0, 3]), x: {type: 'linear', range: window}},
                    curveFactory: curveCardinal,
                }),
            ),
        ).toEqual([0, 11.25]);
    }
});

test('clips a cubic inside its interval without losing its interior maximum', () => {
    const result = getVisiblePathYValues({
        points: [0, 10, 10, 0].map((y, x) => ({x, y})),
        viewport: viewport([1.25, 1.75]),
        curveFactory: curveCardinal,
    });
    const [min, max] = extent(result);
    expect(min).toBeCloseTo(10.9375, 8);
    expect(max).toBeCloseTo(11.25, 8);
});
