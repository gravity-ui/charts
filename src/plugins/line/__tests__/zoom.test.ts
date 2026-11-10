import type {DomainViewport} from '~core/series/axis-contract';
import {getLineSegments, segmentIntersectsRect} from '~core/shapes/line/auto-placement';

import type {LineSeries} from '../../../types';
import {getCurveFactory} from '../interpolation';
import {filterLineData} from '../zoom';

test.each(['before', 'middle', 'after'] as const)(
    'step %s retains original anchors when the viewport contains no samples',
    (position) => {
        const data = Array.from({length: 10_000}, (_, x) => ({x, y: x}));
        const series: LineSeries = {
            type: 'line',
            name: 'Steps',
            data,
            interpolation: {type: 'step', position},
        };
        const viewports: DomainViewport[] = [
            {x: {type: 'linear', range: [24.2, 24.8]}, y: {type: 'linear'}},
            {
                x: {type: 'linear', range: [23.8, 25.2]},
                y: {type: 'linear', range: [24.2, 24.8]},
            },
        ];
        for (const viewport of viewports) {
            const selection = filterLineData({series, viewport});
            expect(selection.data).toEqual([]);
            expect(selection.shapeData).toEqual(data.slice(24, 26));
            expect(selection.shapeData?.[0]).toBe(data[24]);
        }
    },
);

test.each(['linear', 'cardinal', 'monotone'] as const)(
    '%s retains a bounded set of original anchors in a large series',
    (type) => {
        const data = Array.from({length: 10_000}, (_, x) => ({x, y: x}));
        const series: LineSeries = {type: 'line', name: 'Line', data, interpolation: {type}};
        const x = {type: 'linear', range: [24.2, 24.8]} as const;
        for (const y of [{type: 'linear'}, x] as const) {
            const selection = filterLineData({series, viewport: {x, y}});
            expect(selection.data).toEqual([]);
            expect(selection.shapeData).toEqual(
                type === 'linear' ? data.slice(24, 26) : data.slice(23, 27),
            );
            expect(selection.shapeData?.[0]).toBe(data[type === 'linear' ? 24 : 23]);
        }
    },
);

test.each(['cardinal', 'monotone'] as const)(
    '%s preserves repeated anchors around a crossing',
    (type) => {
        const data = [
            {x: 0, y: 0},
            {x: 0, y: 0},
            {x: 10, y: 10},
        ];
        const selection = filterLineData({
            series: {type: 'line', name: 'Curve', data, interpolation: {type}},
            viewport: {
                x: {type: 'linear', range: [4, 6]},
                y: {type: 'linear', range: [4, 6]},
            },
        });
        expect(selection.data).toEqual([]);
        expect(selection.shapeData).toEqual(data);
    },
);

test.each(['cardinal', 'monotone'] as const)(
    '%s preserves the crossing curve and its tangents after pruning',
    (type) => {
        const data = [20, 90, 10, 80, 30, 75, 10].map((y, index) => ({x: index * 10, y}));
        const series: LineSeries = {type: 'line', name: 'Curve', data, interpolation: {type}};
        const viewport: DomainViewport = {
            x: {type: 'linear', range: [24, 26]},
            y: {type: 'linear', range: [40, 60]},
        };
        const selection = filterLineData({series, viewport});
        expect(selection.data).toEqual([]);
        expect(selection.shapeData).toEqual(data.slice(1, 5));
        const crossingSegments = (points: typeof data) =>
            getLineSegments([{points, curveFactory: getCurveFactory({type}), lineWidth: 0}]).filter(
                (segment) => segmentIntersectsRect(segment, {x: 24, y: 40, width: 2, height: 20}),
            );
        const original = crossingSegments(data);
        expect(original.length).toBeGreaterThan(0);
        expect(crossingSegments(selection.shapeData as typeof data)).toEqual(original);
    },
);

test('keeps original gaps between retained paths and discards unrelated tails', () => {
    const data = [
        {x: -10, y: 80},
        {x: 0, y: 60},
        {x: 60, y: 0},
        {x: 100, y: -10},
        {x: 110, y: null},
        {x: -10, y: -10},
        {x: 0, y: 0},
        {x: 100, y: 100},
        {x: 110, y: 110},
    ];
    const selection = filterLineData({
        series: {type: 'line', name: 'Paths', data},
        viewport: {
            x: {type: 'linear', range: [20, 80]},
            y: {type: 'linear', range: [20, 80]},
        },
    });
    expect(selection.data).toEqual([]);
    expect(selection.shapeData).toEqual([data[1], data[2], data[4], data[6], data[7]]);
    expect(selection.shapeData?.[2]).toBe(data[4]);
});

test('an X-only selection preserves gaps between multiple crossing paths', () => {
    const data = [
        {x: 0, y: 0},
        {x: 100, y: 100},
        {x: 110, y: null},
        {x: 0, y: 100},
        {x: 100, y: 0},
    ];
    const selection = filterLineData({
        series: {type: 'line', name: 'Paths', data},
        viewport: {x: {type: 'linear', range: [40, 60]}, y: {type: 'linear'}},
    });
    expect(selection.data).toEqual([]);
    expect(selection.shapeData).toEqual(data);
    expect(selection.shapeData?.[2]).toBe(data[2]);
});

test('preserves offscreen detours between crossings without introducing a shortcut', () => {
    const data = [
        {x: -100, y: 45},
        {x: 0, y: 45},
        {x: 100, y: 45},
        {x: 100, y: 100},
        {x: 0, y: 100},
        {x: 0, y: 55},
        {x: 100, y: 55},
        {x: 200, y: 55},
    ];
    const selection = filterLineData({
        series: {type: 'line', name: 'Detour', data},
        viewport: {
            x: {type: 'linear', range: [40, 60]},
            y: {type: 'linear', range: [40, 60]},
        },
    });
    expect(selection.data).toEqual([]);
    expect(selection.shapeData).toEqual(data.slice(1, 7));
});
