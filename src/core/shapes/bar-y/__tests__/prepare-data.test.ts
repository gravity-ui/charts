/** @jest-environment jsdom */

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarYSeries} from '../../../../plugins/bar-y/prepare-bar-y-series';
import type {BarYSeries, ChartSeriesOptions} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedLegend} from '../../../series/types';
import {prepareBarYData} from '../prepare-data';

interface PrepareOptions {
    height?: number;
    reversed?: boolean;
    series?: Pick<BarYSeries, 'barPadding' | 'borderWidth'>;
    seriesOptions?: ChartSeriesOptions['bar-y'];
}

async function prepare(
    values: number[],
    stacking: BarYSeries['stacking'],
    width = 400,
    options: PrepareOptions = {},
) {
    const height = options.height ?? 200;
    const series = await prepareBarYSeries({
        series: values.map((x, index) => ({
            type: 'bar-y',
            name: String(index),
            stacking,
            ...options.series,
            data: [{x, y: 'A'}],
        })),
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
        seriesOptions: {'bar-y': options.seriesOptions},
    });
    return prepareBarYData({
        series,
        seriesOptions: {
            ...seriesOptionsDefaults,
            'bar-y': {...seriesOptionsDefaults['bar-y'], ...options.seriesOptions},
        },
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear()
            .domain(values.some((value) => value < 0) ? [-100, 100] : [0, 100])
            .range(options.reversed ? [width, 0] : [0, width]),
        yAxis: [{type: 'category', categories: ['A']}] as PreparedYAxis[],
        yScale: [scaleBand().domain(['A']).range([0, height])],
        boundsWidth: width,
        boundsHeight: height,
    });
}

describe('bar-y suppressed borders', () => {
    test.each<{name: string; options: PrepareOptions}>([
        {name: 'shared padding', options: {seriesOptions: {barPadding: 0.94}}},
        {
            name: 'series padding on a reversed axis',
            options: {series: {barPadding: 0.94}, reversed: true},
        },
        {name: 'width limit equal to two borders', options: {seriesOptions: {barMaxWidth: 16}}},
        {name: 'zero available height', options: {height: 0}},
        {
            name: 'group padding exceeds available space',
            options: {seriesOptions: {groupPadding: 2}},
        },
    ])('preserves unbordered stack geometry with $name', async ({options}) => {
        const values = [50, 25, -30, -15];
        const plain = await prepare(values, 'normal', 400, options);
        const bordered = await prepare(values, 'normal', 400, {
            ...options,
            series: {...options.series, borderWidth: 8},
        });
        expect(bordered.shapes).toHaveLength(values.length);
        bordered.shapes.forEach((shape, index) => {
            expect(shape.borderWidth).toBe(0);
            expect(shape.x).toBeCloseTo(plain.shapes[index].x);
            expect(shape.width).toBeCloseTo(plain.shapes[index].width);
        });
    });
});

describe('bar-y percentage', () => {
    test.each([200, 600].flatMap((width) => [1, 1e-14].map((unit) => ({width, unit}))))(
        'uses raw values at width $width and scale $unit',
        async ({width, unit}) => {
            const {shapes} = await prepare([unit, 3 * unit], 'percent', width);
            expect(shapes.map((item) => item.percentage)).toEqual([0.25, 0.75]);
            expect(shapes.map((item) => item.data.x)).toEqual([unit, 3 * unit]);
        },
    );

    test('returns zero shares and finite geometry for an empty total', async () => {
        const {shapes} = await prepare([0, 0], 'percent');
        expect(shapes.map((item) => item.percentage)).toEqual([0, 0]);
        expect(shapes.map((item) => item.width)).toEqual([0, 0]);
        expect(shapes.every((item) => Number.isFinite(item.x))).toBe(true);
    });

    test.each([undefined, 'normal'] as const)(
        'omits percentage with stacking=%s',
        async (stacking) => {
            const {shapes} = await prepare([1, 3], stacking);
            expect(shapes.map((item) => item.percentage)).toEqual([undefined, undefined]);
        },
    );
});
