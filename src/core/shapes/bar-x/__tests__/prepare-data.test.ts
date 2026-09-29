/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarXSeries} from '../../../../plugins/bar-x/prepare-bar-x-series';
import type {BarXSeries} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedSplit} from '../../../layout/split-types';
import type {PreparedBarXSeries, PreparedLegend} from '../../../series/types';
import {prepareBarXData} from '../prepare-data';

async function prepare(values: number[], stacking: BarXSeries['stacking'], height = 200) {
    const series = prepareBarXSeries({
        series: values.map((y, index) => ({
            type: 'bar-x',
            name: String(index),
            stacking,
            data: [{x: 1, y}],
        })),
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedBarXSeries[];
    return prepareBarXData({
        series,
        seriesOptions: seriesOptionsDefaults,
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 2]).range([0, 400]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 100]).range([height, 0])],
        boundsHeight: height,
        split: {plots: [{top: 0, height}]} as PreparedSplit,
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
