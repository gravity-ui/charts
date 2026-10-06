import get from 'lodash/get';

import type {
    BarXSeries,
    BarXSeriesData,
    ChartAxis,
    ChartXAxis,
    LineSeries,
    ScatterSeries,
} from '../../../types';
import {getSortedSeriesData} from '../series/sorting';

const categories = ['a', 'b', 'c'];

function getBarXSeries(data: BarXSeriesData[]): BarXSeries {
    return {type: 'bar-x', name: 'Series', data};
}

function getLineSeries(yValues: (number | string)[], yAxis?: number): LineSeries {
    return {
        type: 'line',
        name: 'Series',
        yAxis,
        data: yValues.map((y, index) => ({x: index, y})),
    };
}

function getXValues(xValues: (number | string)[], xAxis: ChartXAxis) {
    const series = getBarXSeries(xValues.map((x, index) => ({x, y: index + 1})));
    const [result] = getSortedSeriesData({seriesData: [series], xAxis});

    return result.data.map((d) => get(d, 'x'));
}

function getYValues(series: LineSeries, yAxis: ChartAxis[]) {
    const [result] = getSortedSeriesData({seriesData: [series], yAxis});

    return result.data.map((d) => get(d, 'y'));
}

describe('getSortedSeriesData', () => {
    test.each<{title: string; xAxis: ChartXAxis; input: (number | string)[]; expected: unknown[]}>([
        {
            title: 'keeps category names as is',
            xAxis: {type: 'category', categories},
            input: ['a', 'b', 'c'],
            expected: ['a', 'b', 'c'],
        },
        {
            title: 'remaps numeric indexes according to the axis order',
            xAxis: {type: 'category', categories, order: 'reverse'},
            input: [0, 1, 2],
            expected: [2, 1, 0],
        },
        {
            title: 'keeps category names as is regardless of the axis order',
            xAxis: {type: 'category', categories, order: 'reverse'},
            input: ['a', 'b', 'c'],
            expected: ['a', 'b', 'c'],
        },
        {
            title: 'handles category names and numeric indexes in one series',
            xAxis: {type: 'category', categories, order: 'reverse'},
            input: [0, 'b', 2],
            expected: [2, 'b', 0],
        },
        {
            title: 'drops numeric indexes cut off by min/max',
            xAxis: {type: 'category', categories, min: 1, max: 2},
            input: [0, 1, 2],
            expected: [0, 1],
        },
        {
            title: 'drops category names cut off by min/max',
            xAxis: {type: 'category', categories, min: 1, max: 2},
            input: ['a', 'b', 'c'],
            expected: ['b', 'c'],
        },
        {
            title: 'drops unknown numeric indexes',
            xAxis: {type: 'category', categories},
            input: [0, 5],
            expected: [0],
        },
        {
            title: 'drops unknown category names',
            xAxis: {type: 'category', categories},
            input: ['a', 'z'],
            expected: ['a'],
        },
        {
            title: 'drops category names matching Object.prototype members',
            xAxis: {type: 'category', categories},
            input: ['constructor', 'toString', 'a'],
            expected: ['a'],
        },
    ])('$title', ({xAxis, input, expected}) => {
        expect(getXValues(input, xAxis)).toEqual(expected);
    });

    test('keeps points with category names as the same objects', () => {
        const series = getBarXSeries([
            {x: 'a', y: 1},
            {x: 'b', y: 2},
        ]);
        const xAxis: ChartXAxis = {type: 'category', categories, order: 'reverse'};
        const [result] = getSortedSeriesData({seriesData: [series], xAxis});

        expect(result.data[0]).toBe(series.data[0]);
        expect(result.data[1]).toBe(series.data[1]);
    });

    test('keeps points without a value for the key as the same objects', () => {
        const series: LineSeries = {
            type: 'line',
            name: 'Series',
            data: [{x: 0}, {x: 1, y: null}],
        };
        const yAxis: ChartAxis[] = [{type: 'category', categories}];
        const [result] = getSortedSeriesData({seriesData: [series], yAxis});

        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toBe(series.data[0]);
        expect(result.data[1]).toBe(series.data[1]);
    });
    test('keeps points without x or with x: null as the same objects', () => {
        const series: ScatterSeries = {
            type: 'scatter',
            name: 'Series',
            data: [{y: 1}, {x: null, y: 2}, {x: 'a', y: 3}],
        };
        const xAxis: ChartXAxis = {type: 'category', categories};
        const [result] = getSortedSeriesData({seriesData: [series], xAxis});

        expect(result.data).toHaveLength(3);
        expect(result.data[0]).toBe(series.data[0]);
        expect(result.data[1]).toBe(series.data[1]);
        expect(result.data[2]).toBe(series.data[2]);
    });

    test('applies the y axis order to the y key', () => {
        const yAxis: ChartAxis[] = [{type: 'category', categories, order: 'reverse'}];

        expect(getYValues(getLineSeries([0, 'b', 2]), yAxis)).toEqual([2, 'b', 0]);
    });

    test('uses the y axis the series is bound to', () => {
        const yAxis: ChartAxis[] = [
            {type: 'category', categories},
            {type: 'category', categories: ['k', 'l'], order: 'reverse'},
        ];

        expect(getYValues(getLineSeries([0, 'l', 'a'], 1), yAxis)).toEqual([1, 'l']);
    });
});
