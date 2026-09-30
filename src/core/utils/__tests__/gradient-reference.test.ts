import {color as parseColor} from 'd3-color';
import {scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3-scale';

import type {ChartScale} from '../../scales/types';
import type {LinearGradient} from '../../types';
import {createGradientColorResolver, getGradientBBox} from '../gradient';
import type {SeriesGradientState} from '../gradient-reference';
import {captureGradient, prepareGradientCoords} from '../gradient-reference';

interface Point {
    data: object;
    x: number;
    y: number | null;
}

const gradient: LinearGradient = {
    type: 'linear-gradient',
    angle: 90,
    stops: [
        {offset: 0, color: '#000000'},
        {offset: 1, color: '#f0f0f0'},
    ],
};

function resolveColors(args: {
    points: Point[];
    xScale: ChartScale;
    yScale: ChartScale;
    state: SeriesGradientState;
    color?: LinearGradient;
    yAxisTop?: number;
}) {
    const color = args.color ?? gradient;
    if (args.state.stroke === undefined) {
        args.state.stroke = captureGradient({
            ...args,
            gradient: color,
            bbox: getGradientBBox(args.points),
            yAxisTop: args.yAxisTop ?? 0,
        });
    }
    const coords = prepareGradientCoords({...args, gradient: color, paint: 'stroke'});
    const bbox = getGradientBBox(args.points);
    if (!coords || !bbox) {
        throw new Error('Expected a drawable gradient');
    }
    const getColor = createGradientColorResolver(color, bbox, coords);
    return args.points.map((point) =>
        point.y === null ? null : parseColor(getColor(point.x, point.y))?.formatRgb(),
    );
}

describe('data-anchored gradients', () => {
    test.each([
        [
            'linear',
            [0, 1, 2, 3, 4],
            (domain: [number, number], range: [number, number]) =>
                scaleLinear().domain(domain).range(range),
        ],
        [
            'datetime',
            [0, 1000, 2000, 3000, 4000],
            (domain: [number, number], range: [number, number]) =>
                scaleUtc().domain(domain).range(range),
        ],
        [
            'logarithmic',
            [1, 10, 100, 1000, 10000],
            (domain: [number, number], range: [number, number]) =>
                scaleLog().domain(domain).range(range),
        ],
    ] as const)(
        'preserves colors on %s X axes, including clipping neighbors',
        (_type, x, create) => {
            const original = x.map((value, index) => ({x: value, y: index + 1}));
            const xScale = create([x[0], x[4]], [0, 400]);
            const yScale = scaleLinear().domain([0, 6]).range([200, 0]);
            const points = original.map((data) => ({data, x: xScale(data.x), y: yScale(data.y)}));
            const state: SeriesGradientState = {};
            const before = resolveColors({points, xScale, yScale, state});
            const zoomScale = create([x[2], x[3]], [8, 392]);
            const retained = original.slice(1);
            const after = resolveColors({
                state,
                xScale: zoomScale,
                yScale,
                points: retained.map((data) => ({data, x: zoomScale(data.x), y: yScale(data.y)})),
            });

            expect(before).toEqual([
                'rgb(0, 0, 0)',
                'rgb(60, 60, 60)',
                'rgb(120, 120, 120)',
                'rgb(180, 180, 180)',
                'rgb(240, 240, 240)',
            ]);
            expect(after).toEqual(before.slice(1));
        },
    );

    test.each([false, true])('preserves category colors with reversed=%s', (reversed) => {
        const domain = ['A', 'B', 'C', 'D', 'E'];
        const original = domain.map((x, index) => ({x, y: index + 1}));
        const range = reversed ? [400, 0] : [0, 400];
        const xScale = scaleBand().domain(domain).range(range);
        const yScale = scaleLinear().domain([0, 6]).range([200, 0]);
        const state: SeriesGradientState = {};
        const before = resolveColors({
            state,
            xScale,
            yScale,
            points: original.map((data) => ({
                data,
                x: (xScale(data.x) ?? 0) + xScale.step() / 2,
                y: yScale(data.y),
            })),
        });
        const zoomScale = scaleBand().domain(domain.slice(2)).range(range);
        const after = resolveColors({
            state,
            xScale: zoomScale,
            yScale,
            points: original.slice(2).map((data) => ({
                data,
                x: (zoomScale(data.x) ?? 0) + zoomScale.step() / 2,
                y: yScale(data.y),
            })),
        });
        expect(after).toEqual(before.slice(2));
    });

    test('preserves oblique colors when X and Y rescale differently and the plot moves', () => {
        const original = [
            {x: 0, y: 1},
            {x: 1, y: 4},
            {x: 2, y: 3},
            {x: 3, y: 5},
            {x: 4, y: 2},
        ];
        const xScale = scaleLinear().domain([0, 4]).range([400, 0]);
        const yScale = scaleLinear().domain([0, 6]).range([200, 0]);
        const state: SeriesGradientState = {};
        const color = {...gradient, angle: 45};
        const before = resolveColors({
            state,
            color,
            xScale,
            yScale,
            points: original.map((data) => ({data, x: xScale(data.x), y: yScale(data.y)})),
        });
        const zoomX = scaleLinear().domain([2, 4]).range([300, 0]);
        const zoomY = scaleLinear().domain([2, 5]).range([250, 0]);
        const after = resolveColors({
            state,
            color,
            xScale: zoomX,
            yScale: zoomY,
            yAxisTop: 50,
            points: original.slice(2).map((data) => ({
                data,
                x: zoomX(data.x),
                y: 50 + zoomY(data.y),
            })),
        });
        expect(after).toEqual(before.slice(2));
    });

    test('does not restart the gradient after null gaps', () => {
        const original = [
            {x: 0, y: 1},
            {x: 1, y: 2},
            {x: 2, y: null},
            {x: 3, y: 4},
            {x: 4, y: 5},
        ];
        const xScale = scaleLinear().domain([0, 4]).range([0, 400]);
        const yScale = scaleLinear().domain([0, 6]).range([200, 0]);
        const state: SeriesGradientState = {};
        const points = original.map((data) => ({
            data,
            x: xScale(data.x),
            y: data.y === null ? null : yScale(data.y),
        }));
        const before = resolveColors({points, xScale, yScale, state});
        const zoomX = scaleLinear().domain([3, 4]).range([0, 400]);
        const after = resolveColors({
            state,
            xScale: zoomX,
            yScale,
            points: points.slice(3).map((point) => ({...point, x: zoomX(point.data.x)})),
        });
        expect(after).toEqual(before.slice(3));
    });

    test('keeps the last stop for a degenerate original gradient', () => {
        const data = {x: 1, y: 1};
        const xScale = scaleLinear().domain([0, 2]).range([0, 400]);
        const yScale = scaleLinear().domain([0, 2]).range([200, 0]);
        const state: SeriesGradientState = {};
        const before = resolveColors({
            state,
            xScale,
            yScale,
            points: [{data, x: xScale(data.x), y: yScale(data.y)}],
        });
        const after = resolveColors({
            state,
            xScale: xScale.copy().range([0, 0]),
            yScale,
            points: [{data, x: 0, y: yScale(data.y)}],
        });
        expect(before).toEqual(['rgb(240, 240, 240)']);
        expect(after).toEqual(before);
    });
});

test.each([0, 90, 45])('does not project a zero-height reference into NaN (angle %s)', (angle) => {
    const data = [
        {x: 0, y: 1},
        {x: 1, y: 2},
    ];
    const xScale = scaleLinear().domain([0, 1]).range([0, 400]);
    const yScale = scaleLinear().domain([0, 3]).range([0, 0]);
    const points = data.map((item) => ({data: item, x: xScale(item.x), y: yScale(item.y)}));
    const color = {...gradient, angle};
    const stroke = captureGradient({
        points,
        bbox: getGradientBBox(points),
        gradient: color,
        xScale,
        yScale,
        yAxisTop: 0,
    });
    expect(stroke).toBeNull();
    const resized = yScale.copy().range([200, 0]);
    expect(
        prepareGradientCoords({
            gradient: color,
            state: {stroke},
            paint: 'stroke',
            points,
            xScale,
            yScale: resized,
        }),
    ).toBeNull();
    const resizedPoints = data.map((item) => ({data: item, x: xScale(item.x), y: resized(item.y)}));
    const next = captureGradient({
        points: resizedPoints,
        bbox: getGradientBBox(resizedPoints),
        gradient: color,
        xScale,
        yScale: resized,
        yAxisTop: 0,
    });
    expect(next).not.toBeNull();
    if (!next) {
        throw new Error('Expected a drawable gradient after resize');
    }
    expect(Object.values(next.coords).every(Number.isFinite)).toBe(true);
});
