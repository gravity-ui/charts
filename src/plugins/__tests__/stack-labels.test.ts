/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleLinear, scaleLog, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import {applyScalePadding} from '~core/scales/scale-padding';
import type {PrepareShapeDataArgs, SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import type {BarYShapesArgs, PreparedBarYData} from '~core/shapes/bar-y/types';
import type {SvgLabel} from '~core/shapes/types';
import * as textUtils from '~core/utils/text';

import type {BarStackLabelsOptions, ChartSeries} from '../../types';
import {areaPlugin} from '../area';
import {barXPlugin} from '../bar-x';
import {getBarXStackLabelAnchors} from '../bar-x/stack-labels';
import {barYPlugin} from '../bar-y';
import {getBarYStackLabelAnchors} from '../bar-y/stack-labels';
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
    options: BarStackLabelsOptions = {enabled: true},
    perSeriesOptions: (BarStackLabelsOptions | undefined)[] = [],
    customValues?: (number | null | undefined)[][],
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
    raw.forEach((series, index) => {
        if (series.type === 'bar-x' || series.type === 'bar-y') {
            series.data.forEach((point, category) => {
                point.stackLabelValue = customValues?.[index]?.[category];
                point.label = 'formatted label';
            });
        }
    });
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
    await applyScalePadding(args);

    const result = await plugin.prepareShapeData(args);
    expect(JSON.stringify(raw)).toBe(original);
    return {args, result};
}

function texts(labels: SvgLabel[] = []) {
    return labels.map((label) => label.text).sort();
}

describe('bar-x stack label anchors', () => {
    test('follows both value ends on a reversed axis', async () => {
        const {args} = await prepare(barXPlugin, [[20], [-10], [5], [-3]]);
        args.yScale = [scaleLinear().domain([-100, 100]).range([0, 200])];
        const {renderData} = await barXPlugin.prepareShapeData(args);
        const anchors = getBarXStackLabelAnchors(renderData as PreparedBarXData[], args);
        expect(anchors).toMatchObject([
            {direction: 'bottom', y: 125, total: 25},
            {direction: 'top', y: 87, total: -13},
        ]);
    });

    test.each([false, true])(
        'anchors percent totals at the plot edge, reversed=%s',
        async (reversed) => {
            const {args} = await prepare(barXPlugin, [[1], [0], [3]], 'percent');
            args.split = {plots: [{top: 30, height: 100}]} as PreparedSplit;
            args.yScale = [
                scaleLinear()
                    .domain([0, 100])
                    .range(reversed ? [0, 100] : [100, 0]),
            ];
            const {renderData} = await barXPlugin.prepareShapeData(args);
            const anchors = getBarXStackLabelAnchors(renderData as PreparedBarXData[], args);
            expect(anchors).toMatchObject([
                {direction: reversed ? 'bottom' : 'top', y: reversed ? 130 : 30, total: 4},
            ]);
        },
    );
});

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

describe.each([barXPlugin, barYPlugin])('$type stack overlays', (plugin) => {
    test.each([false, true])(
        'keeps one total at the outer segment, reversed=%s',
        async (reversed) => {
            const {args} = await prepare(plugin, [
                [20, -20],
                [40, -40],
                [10, -10],
            ]);
            Object.assign(args.series[0], {stackId: 'shared', grouping: false});
            Object.assign(args.series[1], {stackId: 'shared', grouping: false});
            Object.assign(args.series[2], {stackId: 'other', stackLabels: {enabled: false}});
            const horizontal = plugin.type === 'bar-y';
            const increases = horizontal ? !reversed : reversed;
            const valueScale = scaleLinear()
                .domain([-100, 100])
                .range(increases ? [0, 400] : [400, 0]);
            if (horizontal) args.xScale = valueScale;
            else args.yScale = [valueScale];
            const {renderData} = await plugin.prepareShapeData(args);
            const shapes = horizontal
                ? (renderData[0] as BarYShapesArgs).shapes
                : (renderData as PreparedBarXData[]);
            const anchors = horizontal
                ? getBarYStackLabelAnchors(shapes as PreparedBarYData[], {
                      xScale: valueScale,
                      seriesOptions: args.seriesOptions,
                      yAxis: args.yAxis,
                  })
                : getBarXStackLabelAnchors(shapes as PreparedBarXData[], args);
            expect(anchors.map((anchor) => anchor.total)).toEqual([60, -60]);
            anchors.forEach((anchor, index) => {
                const outer = shapes.filter(
                    (shape) =>
                        shape.series.name === '1' &&
                        Number(horizontal ? shape.data.x : shape.data.y) ===
                            (index === 0 ? 40 : -40),
                )[0];
                expect(horizontal ? anchor.y : anchor.x).toBeCloseTo(
                    horizontal ? outer.y + outer.height / 2 : outer.x + outer.width / 2,
                );
            });
        },
    );
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

function getBarAnchors(
    plugin: SeriesPlugin,
    args: PrepareShapeDataArgs,
    result: Awaited<ReturnType<SeriesPlugin['prepareShapeData']>>,
) {
    if (!args.xScale) throw new Error('Expected an X scale');
    return plugin.type === 'bar-x'
        ? getBarXStackLabelAnchors(result.renderData as PreparedBarXData[], args)
        : getBarYStackLabelAnchors((result.renderData[0] as BarYShapesArgs).shapes, {
              xScale: args.xScale,
              seriesOptions: args.seriesOptions,
              yAxis: args.yAxis,
          });
}

describe.each([barXPlugin, barYPlugin])('$type custom stack totals', (plugin) => {
    const options: BarStackLabelsOptions = {
        enabled: true,
        valueSource: 'custom',
        allowOverlap: true,
    };

    test('sums a separate measure at the original geometric boundary', async () => {
        const values = [[10], [20]];
        const original = await prepare(plugin, values, 'normal', {enabled: true});
        const prepared = await prepare(plugin, values, 'normal', options, [], [[3], [7]]);
        expect(texts(prepared.result.labels)).toEqual(['10']);
        expect(
            getBarAnchors(plugin, prepared.args, prepared.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        ).toEqual(
            getBarAnchors(plugin, original.args, original.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        );
    });

    test.each([false, true])(
        '100 + 200 keeps its boundary while custom 3 + 7 = 10, reversed=%s',
        async (reversed) => {
            const prepared = await prepare(
                plugin,
                [[100], [200]],
                'normal',
                options,
                [],
                [[3], [7]],
            );
            const horizontal = plugin.type === 'bar-y';
            const scale = scaleLinear()
                .domain([-1000, 1000])
                .range(reversed ? [400, 0] : [0, 400]);
            if (horizontal) prepared.args.xScale = scale;
            else prepared.args.yScale = [scale];
            const result = await plugin.prepareShapeData(prepared.args);
            const anchors = getBarAnchors(plugin, prepared.args, result);
            expect(anchors).toHaveLength(1);
            expect(anchors[0].total).toBe(10);
            if (horizontal) {
                expect(anchors[0].direction).toBe(reversed ? 'left' : 'right');
            } else {
                expect(anchors[0].direction).toBe(reversed ? 'top' : 'bottom');
            }
            // Horizontal reversed stacks retain the existing border compensation.
            expect(
                Math.abs((horizontal ? anchors[0].x : anchors[0].y) - scale(300)),
            ).toBeLessThanOrEqual(1);
            prepared.args.seriesOptions = getPreparedOptions({
                [plugin.type]: {stackLabels: {enabled: true}},
            });
            const original = getBarAnchors(
                plugin,
                prepared.args,
                await plugin.prepareShapeData(prepared.args),
            );
            expect(original[0]).toMatchObject({
                ...anchors[0],
                total: 300,
                options: expect.objectContaining({valueSource: 'value'}),
            });
        },
    );

    test('formats the decimal total independently of label text', async () => {
        const formatter = jest.fn(({value}) => `${value} units`);
        const prepared = await prepare(
            plugin,
            [[10], [20]],
            'normal',
            {
                ...options,
                format: {type: 'custom', formatter},
            },
            [],
            [[0.1], [0.2]],
        );
        expect(texts(prepared.result.labels)).toEqual(['0.3 units']);
        expect(formatter).toHaveBeenCalledWith({value: 0.3});
    });

    test.each([null, undefined])(
        'keeps the outer boundary when its value is %s',
        async (missing) => {
            const original = await prepare(plugin, [[10], [20]]);
            const prepared = await prepare(
                plugin,
                [[10], [20]],
                'normal',
                options,
                [],
                [[3], [missing]],
            );
            expect(texts(prepared.result.labels)).toEqual(['3']);
            expect(
                getBarAnchors(plugin, prepared.args, prepared.result).map(({x, y, direction}) => ({
                    x,
                    y,
                    direction,
                })),
            ).toEqual(
                getBarAnchors(plugin, original.args, original.result).map(({x, y, direction}) => ({
                    x,
                    y,
                    direction,
                })),
            );
        },
    );

    test('excludes disabled participants without shortening the geometric stack', async () => {
        const original = await prepare(plugin, [[10], [20]]);
        const prepared = await prepare(
            plugin,
            [[10], [20]],
            'normal',
            options,
            [undefined, {enabled: false}],
            [[3], [7]],
        );
        expect(texts(prepared.result.labels)).toEqual(['3']);
        expect(
            getBarAnchors(plugin, prepared.args, prepared.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        ).toEqual(
            getBarAnchors(plugin, original.args, original.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        );
    });

    test('does not fall back to coordinates when all custom values are missing', async () => {
        const prepared = await prepare(plugin, [[10], [20]], 'normal', options, [], [[null], []]);
        expect(prepared.result.labels).toEqual([]);
    });

    test.each([{custom: [[0], [0]]}, {custom: [[3], [-3]]}])(
        'keeps a zero custom sum on nonzero geometry: %j',
        async ({custom}) => {
            const prepared = await prepare(plugin, [[10], [20]], 'normal', options, [], custom);
            expect(texts(prepared.result.labels)).toEqual(['0']);
        },
    );

    test('separates signs by geometry, even when custom values have opposite signs', async () => {
        const original = await prepare(plugin, [[10], [-20]]);
        const prepared = await prepare(plugin, [[10], [-20]], 'normal', options, [], [[-3], [7]]);
        expect(texts(prepared.result.labels)).toEqual(['-3', '7']);
        expect(
            getBarAnchors(plugin, prepared.args, prepared.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        ).toEqual(
            getBarAnchors(plugin, original.args, original.result).map(({x, y, direction}) => ({
                x,
                y,
                direction,
            })),
        );
    });

    test('does not create a second total for an empty positive geometric side', async () => {
        const prepared = await prepare(plugin, [[-10], [0]], 'normal', options, [], [[0], [3]]);
        expect(texts(prepared.result.labels)).toEqual(['0']);
        const zero = await prepare(plugin, [[0], [0]], 'normal', options, [], [[3], [7]]);
        expect(texts(zero.result.labels)).toEqual(['10']);
    });

    test('keeps non-stacked bars independent, including repeated categories in one series', async () => {
        const {args} = await prepare(
            plugin,
            [
                [10, 20],
                [30, 40],
            ],
            'normal',
            options,
            [],
            [
                [3, 5],
                [7, 11],
            ],
        );
        args.series.forEach((series) => Object.assign(series, {stacking: undefined}));
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['11', '3', '5', '7']);
        const first = args.series[0];
        if (first.type === 'bar-x') first.data[1].x = first.data[0].x;
        else if (first.type === 'bar-y') first.data[1].y = first.data[0].y;
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['11', '3', '5', '7']);
    });

    test('recalculates totals and boundaries when legend visibility changes', async () => {
        const {args} = await prepare(plugin, [[10], [20]], 'normal', options, [], [[3], [7]]);
        // The chart pipeline passes only visible series to shape preparation.
        const hidden = {...args, series: args.series.slice(0, 1)};
        expect(texts((await plugin.prepareShapeData(hidden)).labels)).toEqual(['3']);
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['10']);
    });

    test('keeps logarithmic geometry independent of custom values', async () => {
        const prepared = await prepare(plugin, [[10], [20]], 'normal', options, [], [[3], [7]]);
        const horizontal = plugin.type === 'bar-y';
        const scale = scaleLog()
            .domain([1, 1000])
            .range(horizontal ? [0, 400] : [200, 0]);
        if (horizontal) {
            prepared.args.xScale = scale;
            prepared.args.xAxis = {...prepared.args.xAxis, type: 'logarithmic'} as PreparedXAxis;
        } else {
            prepared.args.yScale = [scale];
            prepared.args.yAxis = [
                {...prepared.args.yAxis?.[0], type: 'logarithmic'},
            ] as PreparedYAxis[];
        }
        const anchors = getBarAnchors(
            plugin,
            prepared.args,
            await plugin.prepareShapeData(prepared.args),
        );
        prepared.args.seriesOptions = getPreparedOptions({
            [plugin.type]: {stackLabels: {enabled: true}},
        });
        const original = getBarAnchors(
            plugin,
            prepared.args,
            await plugin.prepareShapeData(prepared.args),
        );
        expect(anchors).toHaveLength(1);
        expect(anchors[0]).toMatchObject({
            x: original[0].x,
            y: original[0].y,
            direction: original[0].direction,
            total: 10,
        });
    });

    test('keeps categories and stack ids separate and suppresses range slider labels', async () => {
        const {args} = await prepare(
            plugin,
            [
                [10, 20],
                [30, 40],
            ],
            'normal',
            options,
            [],
            [
                [3, 5],
                [7, 11],
            ],
        );
        Object.assign(args.series[1], {stackId: 'other'});
        expect(texts((await plugin.prepareShapeData(args)).labels)).toEqual(['11', '3', '5', '7']);
        expect((await plugin.prepareShapeData({...args, isRangeSlider: true})).labels).toEqual([]);
    });
});

test('custom column totals separate value axes and split panels with identical categories and stack ids', async () => {
    const {args} = await prepare(
        barXPlugin,
        [[10], [20]],
        'normal',
        {
            enabled: true,
            valueSource: 'custom',
            allowOverlap: true,
        },
        [],
        [[3], [7]],
    );
    Object.assign(args.series[1], {yAxis: 1});
    args.yAxis = [
        {type: 'linear', plotIndex: 0},
        {type: 'linear', plotIndex: 1},
    ] as PreparedYAxis[];
    args.yScale = [
        scaleLinear().domain([0, 100]).range([100, 0]),
        scaleLinear().domain([0, 100]).range([100, 0]),
    ];
    args.split = {
        plots: [
            {top: 0, height: 100},
            {top: 100, height: 100},
        ],
    } as PreparedSplit;
    const anchors = getBarAnchors(barXPlugin, args, await barXPlugin.prepareShapeData(args));
    expect(anchors).toMatchObject([
        {total: 3, plotIndex: 0},
        {total: 7, plotIndex: 1},
    ]);
    expect(anchors[1].y).toBeGreaterThan(100);
});

describe.each([barXPlugin, barYPlugin])('$type stack total space', (plugin) => {
    test.each([
        {stacking: 'normal' as const, reversed: false},
        {stacking: 'normal' as const, reversed: true},
        {stacking: 'percent' as const, reversed: false},
        {stacking: 'percent' as const, reversed: true},
    ])(
        'keeps totals outside the stack without changing the domain: %j',
        async ({stacking, reversed}) => {
            const {args} = await prepare(plugin, [[30], [70]], stacking);
            const horizontal = plugin.type === 'bar-y';
            const scale = scaleLinear()
                .domain([0, 100])
                .range(horizontal ? [0, 400] : [200, 0]);
            if (reversed) scale.range(scale.range().reverse());
            if (horizontal) args.xScale = scale;
            else args.yScale = [scale];

            await applyScalePadding(args);

            const result = await plugin.prepareShapeData(args);
            const [anchor] = getBarAnchors(plugin, args, result);
            const [label] = result.labels ?? [];
            expect(label).toBeDefined();
            expect(scale.domain()).toEqual([0, 100]);
            // Horizontal stacks retain the existing one-pixel border compensation.
            expect(Math.abs((horizontal ? anchor.x : anchor.y) - scale(100))).toBeLessThanOrEqual(
                1.01,
            );

            const left = label.x;
            const top = label.y - (label.size.hangingOffset ?? 0);
            const right = left + label.size.width;
            const bottom = top + label.size.height;
            expect(left).toBeGreaterThanOrEqual(-0.01);
            expect(top).toBeGreaterThanOrEqual(-0.01);
            expect(right).toBeLessThanOrEqual(args.boundsWidth + 0.01);
            expect(bottom).toBeLessThanOrEqual(args.boundsHeight + 0.01);

            switch (anchor.direction) {
                case 'top':
                    expect(bottom).toBeLessThanOrEqual(anchor.y - 5 + 0.01);
                    break;
                case 'bottom':
                    expect(top).toBeGreaterThanOrEqual(anchor.y + 5 - 0.01);
                    break;
                case 'left':
                    expect(right).toBeLessThanOrEqual(anchor.x - 5 + 0.01);
                    break;
                case 'right':
                    expect(left).toBeGreaterThanOrEqual(anchor.x + 5 - 0.01);
                    break;
            }
        },
    );
});

test.each([0, 8, 12, 16])('hides totals when the available dimension is %s', async (span) => {
    for (const direction of ['top', 'bottom', 'left', 'right'] as const) {
        const horizontal = direction === 'left' || direction === 'right';
        const labels = await prepareStackLabels({
            boundsWidth: horizontal ? span : 100,
            boundsHeight: horizontal ? 100 : span,
            anchors: [
                {
                    x: horizontal ? span / 2 : 50,
                    y: horizontal ? 50 : span / 2,
                    total: 100,
                    direction,
                    plotIndex: 0,
                    options: {enabled: true, allowOverlap: true},
                },
            ],
        });
        expect(labels).toEqual([]);
    }
});
