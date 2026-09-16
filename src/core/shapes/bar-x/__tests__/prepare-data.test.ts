/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarXSeries} from '../../../../plugins/bar-x/prepare-bar-x-series';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedSplit} from '../../../layout/split-types';
import type {PreparedBarXSeries, PreparedLegend} from '../../../series/types';
import {prepareBarXData} from '../prepare-data';

describe('bar-x percentage', () => {
    test.each([200, 600].flatMap((height) => [1, 1e-14].map((unit) => ({height, unit}))))(
        'uses raw values at height $height and scale $unit',
        async ({height, unit}) => {
            const series = prepareBarXSeries({
                series: [unit, 3 * unit].map((y, index) => ({
                    type: 'bar-x',
                    name: String(index),
                    stacking: 'percent',
                    data: [{x: 1, y}],
                })),
                colorScale: scaleOrdinal([] as string[], ['#000']),
                colors: [],
                legend: {enabled: false} as PreparedLegend,
            }) as PreparedBarXSeries[];
            const result = await prepareBarXData({
                series,
                seriesOptions: seriesOptionsDefaults,
                xAxis: {type: 'linear'} as PreparedXAxis,
                xScale: scaleLinear().domain([0, 2]).range([0, 400]),
                yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
                yScale: [scaleLinear().domain([0, 100]).range([height, 0])],
                boundsHeight: height,
                split: {plots: [{top: 0, height}]} as PreparedSplit,
            });
            expect(result.map((item) => item.percentage)).toEqual([0.25, 0.75]);
            expect(result.map((item) => item.data.y)).toEqual([unit, 3 * unit]);
        },
    );
});
