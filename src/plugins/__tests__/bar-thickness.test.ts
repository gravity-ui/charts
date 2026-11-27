/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import {validateData} from '~core/validation';

import type {ChartSeries} from '../../types';
import {barXPlugin} from '../bar-x';
import type {PreparedBarXData} from '../bar-x/types';
import {barYPlugin} from '../bar-y';
import type {BarYShapesArgs} from '../bar-y/types';
import {waterfallPlugin} from '../waterfall';
import type {PreparedWaterfallData} from '../waterfall/types';
import {xRangePlugin} from '../x-range';
import type {PreparedXRangeData} from '../x-range/types';

const positions = [1, 5, 2];
const cases: {plugin: SeriesPlugin; horizontal: boolean; raw: ChartSeries}[] = [
    {
        plugin: barXPlugin,
        horizontal: false,
        raw: {type: 'bar-x', name: 'Bars', data: positions.map((x) => ({x, y: 1}))},
    },
    {
        plugin: waterfallPlugin,
        horizontal: false,
        raw: {type: 'waterfall', name: 'Changes', data: positions.map((x) => ({x, y: 1}))},
    },
    {
        plugin: barYPlugin,
        horizontal: true,
        raw: {type: 'bar-y', name: 'Bars', data: positions.map((y) => ({x: 1, y}))},
    },
    {
        plugin: xRangePlugin,
        horizontal: true,
        raw: {type: 'x-range', name: 'Intervals', data: positions.map((y) => ({x0: 1, x1: 3, y}))},
    },
];

describe.each(cases)('$raw.type thickness', ({plugin, horizontal, raw}) => {
    test.each([
        {spacing: 40, options: {}, expected: 28.8},
        {spacing: 100, options: {}, expected: 50},
        {spacing: 0.5, options: {}, expected: 1},
        {spacing: 0, options: {}, expected: 1},
        {spacing: 40, options: {barMaxWidth: 12}, expected: 12},
        {spacing: 40, options: {barPadding: 0.75}, expected: 9},
    ])(
        'uses $expected px at $spacing px spacing with $options',
        async ({spacing, options, expected}) => {
            const seriesOptions = {[raw.type]: options};
            const series = await plugin.prepareSeries({
                series: [raw],
                seriesOptions,
                colorScale: scaleOrdinal<string, string>().range(['#000']),
                colors: [],
                legend: {enabled: false} as PreparedLegend,
            });
            const positionScale = scaleLinear()
                .domain([0, 6])
                .range([0, 6 * spacing]);
            const valueScale = scaleLinear().domain([0, 10]).range([0, 200]);
            const result = await plugin.prepareShapeData({
                series,
                seriesOptions: getPreparedOptions(seriesOptions),
                xAxis: {type: 'linear'} as PreparedXAxis,
                yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
                xScale: horizontal ? valueScale : positionScale,
                yScale: [horizontal ? positionScale : valueScale],
                boundsWidth: horizontal ? 200 : 6 * spacing,
                boundsHeight: horizontal ? 6 * spacing : 200,
                split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
            });
            const shapes =
                raw.type === 'bar-y'
                    ? (result.renderData[0] as BarYShapesArgs).shapes
                    : (result.renderData as (
                          | PreparedBarXData
                          | PreparedWaterfallData
                          | PreparedXRangeData
                      )[]);
            expect(shapes).toHaveLength(positions.length);
            const centers = shapes
                .map(({x, y, width, height}) => {
                    expect(horizontal ? height : width).toBeCloseTo(expected);
                    if (raw.type === 'x-range') {
                        expect([x, width]).toEqual([20, 40]);
                    }
                    return horizontal ? y + height / 2 : x + width / 2;
                })
                .sort((a, b) => a - b);
            [1, 2, 5].forEach((p, i) => expect(centers[i]).toBeCloseTo(p * spacing));
        },
    );
});

test.each([{barMaxWidth: 0.5}, {barMaxWidth: Infinity}, {barPadding: -1}, {barPadding: 1.1}])(
    'rejects invalid x-range sizing options %j',
    (options) => {
        expect(() =>
            validateData({
                series: {
                    options: {'x-range': options},
                    data: [{type: 'x-range', name: 'Task', data: [{x0: 1, x1: 3, y: 1}]}],
                },
            }),
        ).toThrow(/barMaxWidth|barPadding/);
    },
);
