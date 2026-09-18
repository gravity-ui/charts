/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PrepareShapeDataArgs, SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import type {SvgLabel} from '~core/shapes/types';
import * as textUtils from '~core/utils/text';

import type {ChartSeries, StackLabelsOptions} from '../../types';
import {areaPlugin} from '../area';
import {barXPlugin} from '../bar-x';
import {barYPlugin} from '../bar-y';
import {prepareStackLabels} from '../stack-labels';
import type {StackLabelAnchor} from '../stack-labels';

const plugins = [barXPlugin, barYPlugin, areaPlugin];

beforeEach(() => {
    jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async (text) => ({
        width: text.length * 7,
        height: 12,
        hangingOffset: 2,
    }));
});

afterEach(() => jest.restoreAllMocks());

async function prepare(
    plugin: SeriesPlugin,
    values: (number | null)[][],
    stacking: 'normal' | 'percent' = 'normal',
    options: StackLabelsOptions = {enabled: true},
    perSeriesOptions: (StackLabelsOptions | undefined)[] = [],
) {
    const horizontal = plugin.type === 'bar-y';
    const raw: ChartSeries[] = values.map((points, index) =>
        horizontal
            ? {
                  type: 'bar-y',
                  name: String(index),
                  stacking,
                  data: points.map((x, y) => ({x, y: y + 1})),
              }
            : {
                  type: plugin.type as 'bar-x' | 'area',
                  name: String(index),
                  stacking,
                  data: points.map((y, x) => ({x: x + 1, y})),
              },
    );
    raw.forEach((series, index) => Object.assign(series, {stackLabels: perSeriesOptions[index]}));
    const original = JSON.stringify(raw);
    const series = await plugin.prepareSeries({
        series: raw,
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    const valueScale = scaleLinear()
        .domain([-100, 100])
        .range(horizontal ? [0, 400] : [200, 0]);
    const categoryScale = scaleLinear()
        .domain([0, 4])
        .range(horizontal ? [200, 0] : [0, 400]);
    if (stacking === 'percent') valueScale.domain([0, 100]);
    const args: PrepareShapeDataArgs = {
        series,
        seriesOptions: getPreparedOptions({[plugin.type]: {stackLabels: options}}),
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: horizontal ? valueScale : categoryScale,
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [horizontal ? categoryScale : valueScale],
        boundsHeight: 200,
        boundsWidth: 400,
        split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
    };
    const result = await plugin.prepareShapeData(args);
    expect(JSON.stringify(raw)).toBe(original);
    return {args, result};
}

function texts(labels: SvgLabel[] = []) {
    return labels.map((label) => label.text).sort();
}

describe.each(plugins)('$type stack labels', (plugin) => {
    test.each(['normal', 'percent'] as const)(
        'calculates decimal totals before formatting in %s stacks',
        async (stacking) => {
            const formatter = jest.fn(({value}) => String(value));
            const {result} = await prepare(plugin, [[0.2], [0.1]], stacking, {
                enabled: true,
                format: {type: 'custom', formatter},
            });
            expect(formatter).toHaveBeenCalledWith({value: 0.3});
            expect(texts(result.labels)).toEqual(['0.3']);
        },
    );

    test.each(['normal', 'percent'] as const)(
        'shows raw sums with %s stacking',
        async (stacking) => {
            const {result} = await prepare(
                plugin,
                [
                    [10, 20, 30],
                    [20, 30, 40],
                ],
                stacking,
            );
            expect(texts(result.labels)).toEqual(['30', '50', '70']);
        },
    );

    test('separates positive and negative totals, keeps zero and skips nulls', async () => {
        const {result} = await prepare(plugin, [
            [10, 0, null],
            [20, 0, null],
            [-15, 0, null],
            [-25, 0, null],
        ]);
        expect(texts(result.labels)).toEqual(['-40', '0', '30']);
    });

    test('does not show a zero total alongside a negative stack', async () => {
        const {result} = await prepare(
            plugin,
            [
                [-10, -20],
                [0, -5],
            ],
            'normal',
            {enabled: true, allowOverlap: true},
        );
        expect(texts(result.labels)).toEqual(['-10', '-25']);
    });

    test('keeps zero totals in a separate stack', async () => {
        const {args} = await prepare(plugin, [[-10], [0]], 'normal', {
            enabled: true,
            allowOverlap: true,
        });
        Object.assign(args.series[1], {stackId: 'zero'});
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['-10', '0']);
    });

    test('disabled by default, for unstacked series and in range slider', async () => {
        const {args, result} = await prepare(plugin, [[10], [20]], 'normal', {});
        expect(result.labels).toEqual([]);
        const unstacked = await prepare(plugin, [[10]]);
        Object.assign(unstacked.args.series[0], {stacking: undefined});
        expect((await plugin.prepareShapeData(unstacked.args)).labels).toEqual([]);
        args.seriesOptions = getPreparedOptions({[plugin.type]: {stackLabels: {enabled: true}}});
        expect((await plugin.prepareShapeData({...args, isRangeSlider: true})).labels).toEqual([]);
    });

    test('calculates each stack independently', async () => {
        const {args} = await prepare(plugin, [[10], [20]]);
        Object.assign(args.series[0], {stackId: 'a'});
        Object.assign(args.series[1], {stackId: 'b'});
        // Coincident area totals are deliberately both enabled here.
        args.seriesOptions = getPreparedOptions({
            [plugin.type]: {stackLabels: {enabled: true, allowOverlap: true}},
        });
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['10', '20']);
    });

    test('keeps totals outside the visible value range hidden', async () => {
        const {result} = await prepare(plugin, [[60], [70]]);
        expect(result.labels).toEqual([]);
    });

    test.each(['normal', 'percent'] as const)(
        'series can opt into %s totals without changing stack geometry',
        async (stacking) => {
            const values = [
                [10, 20],
                [20, 30],
            ];
            const {result: all} = await prepare(plugin, values, stacking);
            const {result: selected} = await prepare(
                plugin,
                values,
                stacking,
                {},
                plugin.type === 'area' ? [{enabled: true}] : [undefined, {enabled: true}],
            );
            expect(texts(selected.labels)).toEqual(
                plugin.type === 'area' ? ['10', '20'] : ['20', '30'],
            );
            // The selected outer series keeps its cumulative position, including the
            // disabled inner series. Only the displayed sum changes.
            expect(selected.labels?.map(({x, y}) => ({x, y}))).toEqual(
                all.labels?.map(({x, y}) => ({x, y})),
            );
        },
    );

    test('series can opt out of inherited totals, including separate signs and zeros', async () => {
        const {result} = await prepare(
            plugin,
            [
                [10, -10, 0],
                [20, -20, 0],
            ],
            'normal',
            {enabled: true},
            [{enabled: false}],
        );
        expect(texts(result.labels)).toEqual(['-20', '0', '20']);
        const {result: disabled} = await prepare(plugin, [[10], [20]], 'normal', {enabled: true}, [
            {enabled: false},
            {enabled: false},
        ]);
        expect(disabled.labels).toEqual([]);
    });

    test('inherits styles and format while honoring per-series overrides', async () => {
        const {result} = await prepare(
            plugin,
            [[10]],
            'normal',
            {
                style: {fontSize: '18px', fontColor: 'red'},
                format: {type: 'number', precision: 0, postfix: ' units'},
            },
            [{enabled: true, style: {fontColor: 'blue'}}],
        );
        expect(texts(result.labels)).toEqual(['10 units']);
        expect(result.labels?.[0].style).toMatchObject({fontSize: '18px', fontColor: 'blue'});
    });

    test('positions subtotals at the outer participating series', async () => {
        const {result: selected} = await prepare(
            plugin,
            [[10], [20]],
            'normal',
            {},
            plugin.type === 'area' ? [undefined, {enabled: true}] : [{enabled: true}],
        );
        const {result: inner} = await prepare(plugin, [[plugin.type === 'area' ? 20 : 10]]);
        expect(selected.labels).toEqual(inner.labels);
    });

    test('renders separate stacks with their own styles and formats', async () => {
        const {args} = await prepare(plugin, [[10], [20]], 'normal', {}, [
            {enabled: true, allowOverlap: true, style: {fontColor: 'red'}},
            {
                enabled: true,
                allowOverlap: true,
                style: {fontColor: 'blue'},
                format: {type: 'number', postfix: ' units'},
            },
        ]);
        Object.assign(args.series[1], {stackId: 'other'});
        const result = await plugin.prepareShapeData(args);
        expect(result.labels).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    text: '10',
                    style: expect.objectContaining({fontColor: 'red'}),
                }),
                expect.objectContaining({
                    text: '20 units',
                    style: expect.objectContaining({fontColor: 'blue'}),
                }),
            ]),
        );
        expect(result.labels).toHaveLength(2);
    });
});

test('hides overlapping totals unless allowOverlap is enabled', async () => {
    const anchors: StackLabelAnchor[] = [10, 15, 80].map((x) => ({
        options: {enabled: true},
        x,
        y: 30,
        total: 5,
        direction: 'top',
        plotIndex: 0,
    }));
    const args = {anchors, boundsWidth: 100, boundsHeight: 100};
    expect(await prepareStackLabels(args)).toHaveLength(2);
    expect(
        await prepareStackLabels({
            ...args,
            anchors: anchors.map((anchor) => ({
                ...anchor,
                options: {enabled: true, allowOverlap: true},
            })),
        }),
    ).toHaveLength(3);
});

test('passes the raw total to a custom formatter', async () => {
    const formatter = jest.fn(({value}) => `Total ${value}`);
    const labels = await prepareStackLabels({
        anchors: [
            {
                x: 50,
                y: 60,
                total: 30,
                direction: 'top',
                plotIndex: 0,
                options: {enabled: true, format: {type: 'custom', formatter}},
            },
        ],
        boundsWidth: 100,
        boundsHeight: 100,
    });
    expect(texts(labels)).toEqual(['Total 30']);
    expect(formatter).toHaveBeenCalledWith({value: 30});
});

test('reuses text measurements across stacks with equivalent styles', async () => {
    const measure = jest.fn(async () => ({width: 7, height: 12, hangingOffset: 2}));
    jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(measure);
    await prepareStackLabels({
        boundsWidth: 100,
        boundsHeight: 100,
        anchors: [10, 50].map((x, index) => ({
            x,
            y: 30,
            total: 5,
            direction: 'top',
            plotIndex: 0,
            options: {
                enabled: true,
                style:
                    index === 0
                        ? {fontSize: '14px', fontColor: 'red'}
                        : {fontColor: 'red', fontSize: '14px'},
            },
        })),
    });
    expect(textUtils.getTextSizeFn).toHaveBeenCalledTimes(1);
    expect(measure).toHaveBeenCalledTimes(1);
});
