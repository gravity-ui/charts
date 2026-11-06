import type {AxisDomainValue, DomainViewport} from '~core/series/plugin';

import {getVisiblePathYValues} from '../path-domain';

const points = [
    {x: 0, y: 20},
    {x: 10, y: 80},
];

function extent(values: AxisDomainValue[] | undefined) {
    const numbers = values?.map(Number) ?? [];
    return [Math.min(...numbers), Math.max(...numbers)];
}

function viewport(range: readonly [number, number]): DomainViewport {
    return {x: {type: 'linear', range}, y: {type: 'linear'}};
}

test.each<{
    step?: 'before' | 'middle' | 'after';
    range: [number, number];
    expected: number[];
}>([
    {range: [2, 4], expected: [32, 44]},
    {step: 'after', range: [2, 4], expected: [20, 20]},
    {step: 'before', range: [2, 4], expected: [80, 80]},
    {step: 'middle', range: [2, 4], expected: [20, 20]},
    {step: 'middle', range: [4, 6], expected: [20, 80]},
    {step: 'middle', range: [5, 6], expected: [20, 80]},
    {step: 'after', range: [2, 10], expected: [20, 80]},
    {range: [3, 3], expected: [38, 38]},
])('uses visible path values for $step in $range', ({step, range, expected}) => {
    expect(extent(getVisiblePathYValues({points, viewport: viewport(range), step}))).toEqual(
        expected,
    );
});

test('includes an interior peak as well as the viewport edges', () => {
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
});

test('clips descending numeric strings without changing the input', () => {
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
});

test('excludes a distant step anchor from the visible domain', () => {
    expect(
        extent(
            getVisiblePathYValues({
                points: [
                    {x: 0, y: 20},
                    {x: 10, y: 1e6},
                ],
                viewport: viewport([2, 4]),
                step: 'after',
            }),
        ),
    ).toEqual([20, 20]);
});

test('interpolates in logarithmic coordinates', () => {
    const values = getVisiblePathYValues({
        points: [
            {x: 1, y: 1},
            {x: 100, y: 100},
        ],
        viewport: {x: {type: 'logarithmic', range: [10, 10]}, y: {type: 'logarithmic'}},
    });
    expect(values?.length).toBeGreaterThan(0);
    for (const value of values ?? []) expect(Number(value)).toBeCloseTo(10);
});

test('does not join gaps or invent values outside the path', () => {
    expect(
        getVisiblePathYValues({
            points: [
                {x: 0, y: 20},
                {x: 1, y: null},
                {x: 10, y: 80},
            ],
            viewport: viewport([2, 4]),
        }),
    ).toEqual([]);
    expect(getVisiblePathYValues({points, viewport: viewport([11, 12])})).toEqual([]);
    expect(getVisiblePathYValues({points, viewport: viewport([4, 2])})).toEqual([]);
});
