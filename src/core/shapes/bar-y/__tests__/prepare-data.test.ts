/** @jest-environment jsdom */

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarYSeries} from '../../../../plugins/bar-y/prepare-bar-y-series';
import type {BarYSeries} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedLegend} from '../../../series/types';
import {prepareBarYData} from '../prepare-data';

async function prepare(values: number[], stacking: BarYSeries['stacking'], width = 400) {
    const series = await prepareBarYSeries({
        series: values.map((x, index) => ({
            type: 'bar-y',
            name: String(index),
            stacking,
            data: [{x, y: 'A'}],
        })),
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    return prepareBarYData({
        series,
        seriesOptions: seriesOptionsDefaults,
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 100]).range([0, width]),
        yAxis: [{type: 'category', categories: ['A']}] as PreparedYAxis[],
        yScale: [scaleBand().domain(['A']).range([0, 200])],
        boundsWidth: width,
        boundsHeight: 200,
    });
}

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
