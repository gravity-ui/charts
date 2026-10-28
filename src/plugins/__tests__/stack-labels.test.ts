/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PrepareShapeDataArgs, SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import type {PreparedAreaData} from '~core/shapes/area/types';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import type {BarYShapesArgs, PreparedBarYData} from '~core/shapes/bar-y/types';
import type {SvgLabel} from '~core/shapes/types';
import * as textUtils from '~core/utils/text';

import type {ChartSeries, StackLabelsAggregationArgs, StackLabelsOptions} from '../../types';
import {areaPlugin} from '../area';
import {getAreaStackLabelAnchors} from '../area/stack-labels';
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
    options: StackLabelsOptions = {enabled: true},
    perSeriesOptions: (StackLabelsOptions | undefined)[] = [],
    configure?: (series: ChartSeries[]) => void,
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
    configure?.(raw);
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
    return {args, result, raw};
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
        'aggregates original custom data independently of geometry in %s stacks',
        async (stacking) => {
            const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) =>
                points.reduce((sum, point) => sum + point.custom.orders, 0),
            );

            const {args, result, raw} = await prepare(
                plugin,
                [[30], [20]],
                stacking,
                {enabled: true, aggregation, format: {type: 'number', postfix: ' orders'}},
                [],
                (series) =>
                    series.forEach((item, index) => {
                        item.data[0].custom = {orders: index === 0 ? 12 : 8};
                        Object.assign(item.data[0], {label: 'display only'});
                    }),
            );

            args.seriesOptions = getPreparedOptions({
                [plugin.type]: {stackLabels: {enabled: true}},
            });
            const summed = await plugin.prepareShapeData(args);
            const geometry = (data: typeof result.renderData) => {
                if (plugin.type === 'area') {
                    return (data as PreparedAreaData[]).map((item) =>
                        item.points.map(({x, y, y0}) => ({x, y, y0})),
                    );
                }
                const bars =
                    plugin.type === 'bar-y'
                        ? (data as BarYShapesArgs[]).flatMap((item) => item.shapes)
                        : (data as PreparedBarXData[]);
                return bars.map(({x, y, width, height}) => ({x, y, width, height}));
            };

            const points = aggregation.mock.calls[0][0].points;

            expect(texts(result.labels)).toEqual(['20 orders']);
            expect(aggregation).toHaveBeenCalledTimes(1);
            expect(points).toHaveLength(2);
            raw.forEach((series) => expect(points).toContain(series.data[0]));
            expect(geometry(result.renderData)).toEqual(geometry(summed.renderData));
            expect(result.labels?.map(({y}) => y)).toEqual(summed.labels?.map(({y}) => y));
            if (plugin.type === 'bar-y') {
                const bars = (result.renderData as BarYShapesArgs[]).flatMap((item) => item.shapes);
                const boundaryX = Math.max(...bars.map((bar) => bar.x + bar.width));

                for (const label of [...(result.labels ?? []), ...(summed.labels ?? [])]) {
                    if (stacking === 'percent') {
                        expect(label.x + label.size.width).toBeCloseTo(args.boundsWidth);
                    } else {
                        expect(label.x).toBeCloseTo(boundaryX + 5);
                    }
                }
            }
        },
    );

    test('uses geometry signs and zero suppression independently of callback results', async () => {
        const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) =>
            points.some((point) => Number(plugin.type === 'bar-y' ? point.x : point.y) < 0) ? 7 : 0,
        );

        const {result} = await prepare(
            plugin,
            [
                [20, 0],
                [-10, -5],
                [0, 0],
            ],
            'normal',
            {
                enabled: true,
                aggregation,
                allowOverlap: true,
            },
        );

        expect(texts(result.labels)).toEqual(['0', '7', '7']);
        expect(aggregation).toHaveBeenCalledTimes(3);
        for (const [{points}] of aggregation.mock.calls) {
            const signs = new Set(
                points.map((point) => Number(plugin.type === 'bar-y' ? point.x : point.y) < 0),
            );
            expect(signs.size).toBe(1);
        }
    });

    test('recalculates participating points when visibility changes and excludes disabled series', async () => {
        const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);
        const {args, raw} = await prepare(
            plugin,
            [[10], [20], [30]],
            'normal',
            {enabled: true, aggregation},
            [{enabled: false}],
        );
        aggregation.mockClear();
        // Shape preparation receives visible series from the chart's series pipeline.
        args.series = args.series.filter((series) => series.name !== '1');

        const result = await plugin.prepareShapeData(args);

        expect(texts(result.labels)).toEqual(['1']);
        expect(aggregation).toHaveBeenCalledTimes(1);
        expect(aggregation.mock.calls[0][0].points).toEqual([raw[2].data[0]]);
        expect(aggregation.mock.calls[0][0].points[0]).toBe(raw[2].data[0]);
    });

    test('resolves original points after nullMode preparation', async () => {
        const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);

        const {raw} = await prepare(
            plugin,
            [[10], [null]],
            'normal',
            {enabled: true, aggregation},
            [],
            (series) => series.forEach((item) => Object.assign(item, {nullMode: 'zero'})),
        );

        const points = aggregation.mock.calls[0][0].points;

        expect(points).toHaveLength(2);
        raw.forEach((series) => expect(points).toContain(series.data[0]));
    });

    test('allows a series to override custom aggregation with sum', async () => {
        const aggregation = jest.fn(() => 99);

        const {result} = await prepare(plugin, [[10]], 'normal', {enabled: true, aggregation}, [
            {aggregation: 'sum'},
        ]);

        expect(texts(result.labels)).toEqual(['10']);
        expect(aggregation).not.toHaveBeenCalled();
    });

    test.each([NaN, Infinity, -Infinity])(
        'hides non-finite aggregation results: %s',
        async (value) => {
            const options: StackLabelsOptions = {enabled: true, aggregation: () => value};

            const {result} = await prepare(plugin, [[10]], 'normal', options);

            expect(result.labels).toEqual([]);
        },
    );

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

describe('area stack labels', () => {
    test.each([false, true])('follows both value ends, reversed=%s', async (reversed) => {
        const {args} = await prepare(areaPlugin, [[10], [20], [-10], [-20]]);
        const yScale = scaleLinear()
            .domain([-100, 100])
            .range(reversed ? [0, 200] : [200, 0]);
        args.yScale = [yScale];

        const {renderData} = await areaPlugin.prepareShapeData(args);
        const anchors = getAreaStackLabelAnchors(renderData as PreparedAreaData[], args);

        expect(anchors).toHaveLength(2);
        expect(anchors.find((anchor) => anchor.total === 30)).toMatchObject({
            y: yScale(30),
            direction: reversed ? 'bottom' : 'top',
        });
        expect(anchors.find((anchor) => anchor.total === -30)).toMatchObject({
            y: yScale(-30),
            direction: reversed ? 'top' : 'bottom',
        });
    });

    test.each([
        {sign: 1, reversed: false},
        {sign: 1, reversed: true},
        {sign: -1, reversed: false},
        {sign: -1, reversed: true},
    ])(
        'selects the outer side of a gap, sign=$sign, reversed=$reversed',
        async ({sign, reversed}) => {
            const {args} = await prepare(areaPlugin, [
                [null, sign * 10, sign * 10, sign * 10, null],
                [sign * 20, sign * 20, null, sign * 20, sign * 20],
            ]);
            const yScale = scaleLinear()
                .domain([-100, 100])
                .range(reversed ? [0, 200] : [200, 0]);
            args.yScale = [yScale];

            const {renderData} = await areaPlugin.prepareShapeData(args);
            const anchors = getAreaStackLabelAnchors(renderData as PreparedAreaData[], args);
            const extendsUp = reversed ? sign < 0 : sign > 0;

            for (const x of [200, 400]) {
                expect(anchors.find((anchor) => anchor.x === x)).toMatchObject({
                    total: sign * 30,
                    y: yScale(sign * 20),
                    direction: extendsUp ? 'top' : 'bottom',
                });
            }
        },
    );

    test.each([false, true])(
        'anchors percent totals at the plot edge, reversed=%s',
        async (reversed) => {
            const {args} = await prepare(areaPlugin, [[10], [20]], 'percent');
            args.yScale = [
                scaleLinear()
                    .domain([0, 100])
                    .range(reversed ? [0, 200] : [200, 0]),
            ];

            const {renderData} = await areaPlugin.prepareShapeData(args);
            const anchors = getAreaStackLabelAnchors(renderData as PreparedAreaData[], args);

            expect(anchors).toMatchObject([
                {total: 30, y: reversed ? 200 : 0, direction: reversed ? 'bottom' : 'top'},
            ]);
        },
    );

    test.each(['normal', 'percent'] as const)(
        'includes isolated real points in sum and custom totals for %s stacks',
        async (stacking) => {
            const {args, raw, result} = await prepare(
                areaPlugin,
                [
                    [null, 10, null],
                    [20, 20, 20],
                ],
                stacking,
            );
            const summed = getAreaStackLabelAnchors(result.renderData as PreparedAreaData[], args);
            const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);

            args.seriesOptions = getPreparedOptions({
                area: {stackLabels: {enabled: true, aggregation}},
            });
            const aggregated = getAreaStackLabelAnchors(
                result.renderData as PreparedAreaData[],
                args,
            );
            const middlePoints = aggregation.mock.calls.find(([{points}]) =>
                points.some((point) => point === raw[0].data[1]),
            )?.[0].points;

            expect(summed.find((anchor) => anchor.x === 200)?.total).toBe(30);
            expect(aggregated.find((anchor) => anchor.x === 200)?.total).toBe(2);
            expect(middlePoints).toHaveLength(2);
            expect(middlePoints).toContain(raw[0].data[1]);
            expect(middlePoints).toContain(raw[1].data[1]);
            expect(aggregated.map(({x, y}) => ({x, y}))).toEqual(summed.map(({x, y}) => ({x, y})));
        },
    );

    test.each(['normal', 'percent'] as const)(
        'does not label isolated-only %s stacks without an area boundary',
        async (stacking) => {
            const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);

            for (const value of ['sum', aggregation] as const) {
                const {args, result} = await prepare(areaPlugin, [[null, 10, null]], stacking, {
                    enabled: true,
                    aggregation: value,
                });

                expect(
                    getAreaStackLabelAnchors(result.renderData as PreparedAreaData[], args),
                ).toEqual([]);
                expect(result.labels).toEqual([]);
            }

            expect(aggregation).not.toHaveBeenCalled();
        },
    );

    test.each([
        {value: 10, sign: 1, stacking: 'normal'},
        {value: 30, sign: 1, stacking: 'normal'},
        {value: 10, sign: -1, stacking: 'normal'},
        {value: 30, sign: -1, stacking: 'normal'},
        {value: 10, sign: 1, stacking: 'percent'},
        {value: 30, sign: 1, stacking: 'percent'},
    ] as const)(
        'aggregates both sides of gaps: value=$value, sign=$sign, stacking=$stacking',
        async ({value, sign, stacking}) => {
            const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) =>
                points.reduce((sum, point) => sum + point.custom.orders, 0),
            );
            const {args, raw, result} = await prepare(
                areaPlugin,
                [
                    [null, sign * value, sign * value],
                    [sign * 20, sign * 20, null],
                ],
                stacking,
                {enabled: true},
                [],
                (series) =>
                    series.forEach((item, index) => {
                        item.data.forEach((point) => {
                            point.custom = {orders: index === 0 ? 12 : 8};
                        });
                    }),
            );
            const summed = getAreaStackLabelAnchors(result.renderData as PreparedAreaData[], args);
            args.seriesOptions = getPreparedOptions({
                area: {stackLabels: {enabled: true, aggregation}},
            });

            const aggregated = getAreaStackLabelAnchors(
                result.renderData as PreparedAreaData[],
                args,
            );
            const middleSum = summed.find((anchor) => anchor.x === 200);
            const middleTotal = aggregated.find((anchor) => anchor.x === 200);
            const middlePoints = aggregation.mock.calls.find(([{points}]) =>
                points.some((point) => point === raw[0].data[1]),
            )?.[0].points;

            expect(middleSum?.total).toBe(sign * (value + 20));
            expect(middleTotal?.total).toBe(20);
            expect(middlePoints).toHaveLength(2);
            expect(middlePoints).toContain(raw[0].data[1]);
            expect(middlePoints).toContain(raw[1].data[1]);
            expect(aggregation).toHaveBeenCalledTimes(3);
            expect(aggregated.map(({x, y, direction}) => ({x, y, direction}))).toEqual(
                summed.map(({x, y, direction}) => ({x, y, direction})),
            );
        },
    );

    test('aggregation counts each source point of a real step once', async () => {
        const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);
        const {args, raw, result} = await prepare(areaPlugin, [
            [10, 20, 30],
            [5, 15, null],
        ]);
        const source = raw[0].data[1];
        const stepPoints = (result.renderData as PreparedAreaData[])
            .flatMap((item) => item.points)
            .filter((point) => point.data === source);
        args.seriesOptions = getPreparedOptions({
            area: {stackLabels: {enabled: true, aggregation}},
        });

        getAreaStackLabelAnchors(result.renderData as PreparedAreaData[], args);
        const aggregatedPoints = aggregation.mock.calls.find(([{points}]) =>
            points.some((point) => point === source),
        )?.[0].points;

        expect(stepPoints).toHaveLength(2);
        expect(stepPoints[0].x).toBe(stepPoints[1].x);
        expect(stepPoints[0].y).not.toBe(stepPoints[1].y);
        expect(aggregatedPoints?.filter((point) => point === source)).toHaveLength(1);
        expect(aggregatedPoints).toContain(raw[1].data[1]);
    });

    test('aggregation excludes synthetic missing points', async () => {
        const aggregation = jest.fn(({points}: StackLabelsAggregationArgs) => points.length);

        const {raw} = await prepare(
            areaPlugin,
            [
                [10, 20, 30],
                [5, 15, 25],
            ],
            'normal',
            {enabled: true, aggregation},
            [],
            (series) => {
                series[1].data.splice(1, 1);
            },
        );

        expect(aggregation).toHaveBeenCalledTimes(3);
        for (const [{points}] of aggregation.mock.calls) {
            const expected = raw
                .flatMap((series) => (series.type === 'area' ? series.data : []))
                .filter((point) => point.x === points[0].x);

            expect(new Set(points).size).toBe(points.length);
            expect(points).toHaveLength(expected.length);
            expected.forEach((point) => expect(points).toContain(point));
        }
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
                      boundsWidth: 400,
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
