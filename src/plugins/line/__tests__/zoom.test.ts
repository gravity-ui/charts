import type {LineSeries} from '../../../types';
import {getLineDomainData} from '../zoom';

const series: LineSeries = {
    type: 'line',
    name: 'Price',
    data: [
        {x: 0, y: 20},
        {x: 10, y: 80},
    ],
};

function extent(data: ReturnType<typeof getLineDomainData>) {
    const values = data?.map((point) => Number(point.y)) ?? [];
    return [Math.min(...values), Math.max(...values)];
}

test.each<{
    interpolation?: LineSeries['interpolation'];
    range: [number, number];
    expected: number[];
}>([
    {range: [2, 4], expected: [32, 44]},
    {interpolation: {type: 'step'}, range: [2, 4], expected: [20, 20]},
    {interpolation: {type: 'step', position: 'before'}, range: [2, 4], expected: [80, 80]},
    {interpolation: {type: 'step', position: 'middle'}, range: [2, 4], expected: [20, 20]},
    {interpolation: {type: 'step', position: 'middle'}, range: [4, 6], expected: [20, 80]},
    {interpolation: {type: 'step'}, range: [2, 10], expected: [20, 80]},
    {range: [3, 3], expected: [38, 38]},
])('uses visible values for $interpolation in $range', ({interpolation, range, expected}) => {
    expect(extent(getLineDomainData({series: {...series, interpolation}, xRange: range}))).toEqual(
        expected,
    );
});

test('clips descending numeric-string coordinates without changing the points', () => {
    const data = [
        {x: '10', y: '80'},
        {x: '0', y: '20'},
    ];
    expect(extent(getLineDomainData({series: {...series, data}, xRange: [2, 4]}))).toEqual([
        32, 44,
    ]);
    expect(data).toEqual([
        {x: '10', y: '80'},
        {x: '0', y: '20'},
    ]);
});

test('does not include a distant step anchor in the visible domain', () => {
    expect(
        extent(
            getLineDomainData({
                series: {
                    ...series,
                    interpolation: {type: 'step'},
                    data: [
                        {x: 0, y: 20},
                        {x: 10, y: 1e6},
                    ],
                },
                xRange: [2, 4],
            }),
        ),
    ).toEqual([20, 20]);
});

test('interpolates in logarithmic axis space', () => {
    const data = getLineDomainData({
        series: {
            ...series,
            data: [
                {x: 1, y: 1},
                {x: 100, y: 100},
            ],
        },
        xRange: [10, 10],
        xAxis: {type: 'logarithmic'},
        yAxis: {type: 'logarithmic'},
    });
    for (const point of data ?? []) expect(point.y).toBeCloseTo(10);
    expect(data?.length).toBeGreaterThan(0);
});

test('does not join a gap or invent values outside the data', () => {
    const withGap = {
        ...series,
        data: [
            {x: 0, y: 20},
            {x: 1, y: null},
            {x: 10, y: 80},
        ],
    };
    expect(getLineDomainData({series: withGap, xRange: [2, 4]})).toEqual([]);
    expect(getLineDomainData({series, xRange: [11, 12]})).toEqual([]);
    expect(getLineDomainData({series, xRange: [4, 2]})).toEqual([]);
});
