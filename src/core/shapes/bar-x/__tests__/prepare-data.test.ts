/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarXSeries} from '../../../../plugins/bar-x/prepare-bar-x-series';
import type {BarXSeries, ChartSeriesOptions} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedSplit} from '../../../layout/split-types';
import type {PreparedBarXSeries, PreparedLegend} from '../../../series/types';
import {prepareBarXData} from '../prepare-data';
import {getBarXPaths} from '../utils';

async function prepare(
    values: (number | null)[],
    stacking: BarXSeries['stacking'],
    height = 200,
    options: {
        borderWidth?: number;
        width?: number;
        stackGap?: number;
        reversed?: boolean;
        top?: number;
        grid?: boolean;
        isRangeSlider?: boolean;
        yAxis?: PreparedYAxis[];
    } = {},
) {
    const series = prepareBarXSeries({
        series: values.map((y, index) => ({
            type: 'bar-x',
            name: String(index),
            stacking,
            borderWidth: options.borderWidth,
            data: [{x: 1, y}],
        })),
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedBarXSeries[];
    return prepareBarXData({
        series,
        seriesOptions: {
            ...seriesOptionsDefaults,
            'bar-x': {...seriesOptionsDefaults['bar-x'], stackGap: options.stackGap ?? 1},
        },
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear()
            .domain([0, 2])
            .range([0, options.width ?? 400]),
        yAxis:
            options.yAxis ??
            ([
                {
                    type: 'linear',
                    plotIndex: 0,
                    visible: true,
                    grid: {enabled: options.grid ?? true},
                },
            ] as PreparedYAxis[]),
        yScale: [
            scaleLinear()
                .domain([0, 100])
                .range(options.reversed ? [0, height] : [height, 0]),
        ],
        boundsHeight: height,
        split: {plots: [{top: options.top ?? 0, height}]} as PreparedSplit,
        isRangeSlider: options.isRangeSlider,
    });
}

describe('bar-x percentage', () => {
    test.each([200, 600].flatMap((height) => [1, 1e-14].map((unit) => ({height, unit}))))(
        'uses raw values at height $height and scale $unit',
        async ({height, unit}) => {
            const result = await prepare([unit, 3 * unit], 'percent', height);
            expect(result.map((item) => item.percentage)).toEqual([0.25, 0.75]);
            expect(result.map((item) => item.data.y)).toEqual([unit, 3 * unit]);
        },
    );

    test('returns zero shares and finite geometry for an empty total', async () => {
        const result = await prepare([0, 0], 'percent');
        expect(result.map((item) => item.percentage)).toEqual([0, 0]);
        expect(result.map((item) => item.height)).toEqual([0, 0]);
        expect(result.every((item) => Number.isFinite(item.y))).toBe(true);
    });

    test.each([undefined, 'normal'] as const)(
        'omits percentage with stacking=%s',
        async (stacking) => {
            const result = await prepare([1, 3], stacking);
            expect(result.map((item) => item.percentage)).toEqual([undefined, undefined]);
        },
    );
});

describe('bar-x borders', () => {
    test.each([0, 2, 3])('preserves the fill for a short segment with value %s', async (value) => {
        const [bar] = await prepare([value], undefined, 200, {borderWidth: 3});
        const plain = getBarXPaths({...bar, borderWidth: 0});
        expect(getBarXPaths(bar)).toEqual(plain);
    });

    test.each([
        {series: {}, options: {}, width: 0, color: 'var(--gcharts-shape-border-color)'},
        {series: {}, options: {borderWidth: 3, borderColor: 'red'}, width: 3, color: 'red'},
        {
            series: {borderWidth: 2, borderColor: 'blue'},
            options: {borderWidth: 3, borderColor: 'red'},
            width: 2,
            color: 'blue',
        },
        {
            series: {borderWidth: 0},
            options: {borderWidth: 3, borderColor: 'red'},
            width: 0,
            color: 'red',
        },
    ])('resolves per-series options: $series over $options', ({series, options, width, color}) => {
        const input: BarXSeries = {type: 'bar-x', name: 'A', data: [{x: 1, y: 10}], ...series};
        const seriesOptions: ChartSeriesOptions = {'bar-x': options};
        const original = JSON.stringify({input, seriesOptions});
        const [prepared] = prepareBarXSeries({
            series: [input],
            seriesOptions,
            colorScale: scaleOrdinal([] as string[], ['#000']),
            colors: [],
            legend: {enabled: false} as PreparedLegend,
        }) as PreparedBarXSeries[];
        expect(prepared).toMatchObject({borderWidth: width, borderColor: color});
        expect(JSON.stringify({input, seriesOptions})).toBe(original);
    });

    test('preserves geometry and raw values when borders are enabled', async () => {
        const values = [20, -10, 5, -3, 0];
        const plain = await prepare(values, 'normal', 200, {stackGap: 4});
        const bordered = await prepare(values, 'normal', 200, {borderWidth: 3, stackGap: 4});
        const geometry = (items: typeof plain) =>
            items.map(({x, y, width, height, data}) => ({x, y, width, height, data}));
        expect(geometry(bordered)).toEqual(geometry(plain));
        expect(bordered.map((d) => d.data.y)).toEqual(values);
    });

    test.each([0, 2, 6, 7])(
        'disables borders on dense bars at available width %s',
        async (width) => {
            const [bar] = await prepare([10], undefined, 200, {borderWidth: 3, width});
            expect(bar.borderWidth).toBe(0);
            expect(Number.isFinite(bar.x)).toBe(true);
        },
    );

    test.each([
        {borderWidth: 24, expectedWidth: 24},
        {borderWidth: 25, expectedWidth: 0},
        {borderWidth: 26, expectedWidth: 0},
        {borderWidth: -1, expectedWidth: 0},
        {borderWidth: Infinity, expectedWidth: 0},
        {borderWidth: NaN, expectedWidth: 0},
    ])('handles border width $borderWidth', async ({borderWidth, expectedWidth}) => {
        const [bar] = await prepare([10], undefined, 200, {borderWidth});
        expect(bar.width).toBe(50);
        expect(bar.borderWidth).toBe(expectedWidth);
    });
});

describe('bar-x stack geometry', () => {
    test('aligns with a grid drawn by another axis in the same plot', async () => {
        const items = await prepare([1, 3], 'percent', 100, {
            yAxis: [
                {type: 'linear', plotIndex: 0, visible: false, grid: {enabled: false}},
                {type: 'linear', plotIndex: 0, visible: true, grid: {enabled: true}},
            ] as PreparedYAxis[],
        });
        expect(items.map((item) => item.valueEndPadding)).toEqual([0, 0.5]);
    });

    test.each([{grid: false}, {isRangeSlider: true}])(
        'keeps percent rendering inside the plot with %s',
        async (options) => {
            const items = await prepare([1, 3], 'percent', 100, options);
            expect(items.map((item) => item.valueEndPadding)).toEqual([0, 0]);
        },
    );

    test.each([false, true])(
        'keeps the baseline gap after leading zero values, reversed=%s',
        async (reversed) => {
            const [zero, bar] = await prepare([0, 10], 'normal', 200, {reversed});
            const baselineEnd = reversed ? bar.y : bar.y + bar.height;
            const valueEnd = reversed ? bar.y + bar.height : bar.y;
            expect(Math.abs(baselineEnd - zero.y)).toBe(1);
            expect(valueEnd).toBe(reversed ? 20 : 180);
        },
    );

    test.each([false, true])(
        'fits percent stacks and skips zero/null gaps, reversed=%s',
        async (reversed) => {
            const items = await prepare([1, 0, null, 3, 0], 'percent', 100, {
                stackGap: 4,
                top: 30,
                reversed,
            });
            expect(items.map((item) => item.height)).toEqual([24, 0, 72, 0]);
            expect(items.map((item) => item.percentage)).toEqual([0.25, 0, 0.75, 0]);
            expect(items.map((item) => item.isStackEnd)).toEqual([false, false, true, false]);
            expect(items.every((item) => item.extendsUp === !reversed)).toBe(true);
            const visible = items.filter((item) => item.height > 0).sort((a, b) => a.y - b.y);
            expect(visible[0].y).toBe(30);
            expect(visible[1].y + visible[1].height).toBe(130);
            expect(visible[1].y - visible[0].y - visible[0].height).toBe(4);
        },
    );

    test.each([0, 1, 4])(
        'keeps an eight-segment percent stack inside the plot with gap %s',
        async (stackGap) => {
            const items = await prepare(new Array(8).fill(1), 'percent', 226, {stackGap});
            expect(items[7].y).toBe(0);
            expect(items[0].y + items[0].height).toBe(226);
            for (let index = 1; index < items.length; index++) {
                expect(items[index - 1].y - items[index].y - items[index].height).toBeCloseTo(
                    stackGap,
                );
            }
        },
    );

    test.each([0, 3])(
        'keeps oversized gaps and zero-height plots finite at height %s',
        async (height) => {
            const items = await prepare([1, 2, 3], 'percent', height, {stackGap: 100});
            for (const item of items) {
                expect(Number.isFinite(item.y)).toBe(true);
                expect(item.y).toBeGreaterThanOrEqual(0);
                expect(item.y + item.height).toBeLessThanOrEqual(height);
                expect(item.height).toBe(0);
                expect(item.valueEndPadding).toBe(0);
            }
        },
    );

    test.each([false, true])(
        'marks both stack ends and preserves negative endpoints, reversed=%s',
        async (reversed) => {
            const items = await prepare([20, -10, 5, -3, 0, null], 'normal', 200, {
                stackGap: 4,
                reversed,
            });
            expect(items.map((item) => item.isStackEnd)).toEqual([false, false, true, true, false]);
            expect(items.slice(0, 4).map((item) => item.extendsUp)).toEqual([
                !reversed,
                reversed,
                !reversed,
                reversed,
            ]);
            const negative = [items[1], items[3]].sort((a, b) => a.y - b.y);
            expect(negative[1].y - negative[0].y - negative[0].height).toBe(4);
            const end = reversed ? items[3].y : items[3].y + items[3].height;
            expect(end).toBeCloseTo(reversed ? -26 : 226);
        },
    );
});
