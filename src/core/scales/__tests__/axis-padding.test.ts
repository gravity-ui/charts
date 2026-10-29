/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleLog, scaleOrdinal, scaleUtc} from 'd3-scale';

import {getAutomaticTickValues} from '../../../components/AxisY/utils';
import {createScales} from '../../../hooks/useAxisScales';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import {getPreparedOptions} from '../../series/prepare-options';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLegend, PreparedSeries} from '../../series/types';
import type {ChartAxisPadding, ChartSeries, ChartSeriesOptions} from '../../types';
import {validateData} from '../../validation';
import {applyAxisPadding} from '../axis-padding';

const allAuto: ChartAxisPadding = {min: 'auto', max: 'auto'};
const line: ChartSeries = {
    type: 'line',
    name: 'Revenue',
    marker: {enabled: true, radius: 10, borderWidth: 2},
    data: [
        {x: 0, y: 0},
        {x: 2, y: 100},
    ],
};
async function prepare(raw: ChartSeries[] = [line], options?: ChartSeriesOptions) {
    const series: PreparedSeries[] = [];
    for (const type of new Set(raw.map((s) => s.type))) {
        series.push(
            ...(await getSeriesPlugin(type).prepareSeries({
                series: raw.filter((s) => s.type === type),
                seriesOptions: options,
                colors: [],
                colorScale: scaleOrdinal<string, string>().range(['black']),
                legend: {enabled: false} as PreparedLegend,
            })),
        );
    }
    return {
        series,
        seriesOptions: getPreparedOptions(options),
        xAxis: {
            type: 'linear',
            padding: {max: 0},
            startOnTick: false,
            endOnTick: false,
            ticks: {},
            labels: {lineHeight: 12, padding: 4},
        } as PreparedXAxis,
        yAxis: [
            {
                type: 'linear',
                plotIndex: 0,
                padding: {max: 0},
                startOnTick: false,
                endOnTick: false,
                ticks: {},
                labels: {lineHeight: 12, padding: 4},
            },
        ] as PreparedYAxis[],
        xScale: scaleLinear().domain([0, 2]).range([0, 600]),
        yScale: [scaleLinear().domain([0, 100]).range([300, 0])],
        split: {plots: [{top: 0, height: 300}], gap: 0} as PreparedSplit,
        width: 600,
        height: 300,
    };
}

describe('axis padding', () => {
    test.each([undefined, {}, {min: 0, max: 0}, {min: '0px', max: '0%'}])(
        'does not change scales for %j',
        async (padding) => {
            const args = await prepare();
            args.xAxis.padding = padding;
            args.yAxis[0].padding = padding;
            applyAxisPadding(args);
            expect(args.xScale.domain()).toEqual([0, 2]);
            expect(args.yScale[0].domain()).toEqual([0, 100]);
        },
    );

    test('fits marker paint by expanding domains, preserving pixel ranges and raw config', async () => {
        const args = await prepare();
        args.xAxis.padding = allAuto;
        args.yAxis[0].padding = allAuto;
        const before = JSON.stringify(args.series);
        applyAxisPadding(args);
        expect(args.xScale.range()).toEqual([0, 600]);
        expect(args.yScale[0].range()).toEqual([300, 0]);
        expect(args.xScale(0)).toBeCloseTo(13);
        expect(args.xScale(2)).toBeCloseTo(587);
        expect(args.yScale[0](0)).toBeCloseTo(287);
        expect(args.yScale[0](100)).toBeCloseTo(13);
        expect(JSON.stringify(args.series)).toBe(before);
    });

    test.each([30, '30px'])(
        'uses equivalent size %j at the numeric maximum on a reversed axis',
        async (max) => {
            const args = await prepare();
            args.xScale.range([600, 0]);
            args.xAxis.padding = {max};
            applyAxisPadding(args);
            expect(args.xScale(2)).toBeCloseTo(30);
            expect(args.xScale.domain()[0]).toBe(0);
            expect(args.xScale.range()).toEqual([600, 0]);
        },
    );

    test.each(['min', 'max'] as const)(
        'leaves the explicit %s unchanged and expands only the free side',
        async (side) => {
            const args = await prepare();
            args.xAxis.padding = allAuto;
            args.xAxis[side] = side === 'min' ? 0 : 2;
            applyAxisPadding(args);
            if (side === 'min') {
                expect(args.xScale.domain()[0]).toBe(0);
                expect(args.xScale(2)).toBeCloseTo(587);
            } else {
                expect(args.xScale.domain()[1]).toBe(2);
                expect(args.xScale(0)).toBeCloseTo(13);
            }
        },
    );

    test('a zero side stays unchanged while the other side expands and rounds', async () => {
        const args = await prepare();
        args.xScale.domain([0.3, 2]);
        args.xAxis = {
            ...args.xAxis,
            padding: {min: 0, max: 30},
            startOnTick: true,
            endOnTick: true,
        };
        applyAxisPadding(args);
        expect(args.xScale.domain()[0]).toBe(0.3);
        expect(args.xScale(2)).toBeLessThanOrEqual(570);
    });

    test('reuses existing space instead of adding the marker radius again', async () => {
        const args = await prepare();
        args.xAxis.padding = allAuto;
        args.xScale.domain([-1, 3]);
        applyAxisPadding(args);
        expect(args.xScale.domain()).toEqual([-1, 3]);
    });

    test('reserves hover sizes before interaction', async () => {
        const args = await prepare(undefined, {
            line: {states: {hover: {marker: {radius: 20, borderWidth: 4}}}},
        });
        args.xAxis.padding = allAuto;
        applyAxisPadding(args);
        expect(args.xScale(0)).toBeCloseTo(26);
        expect(args.xScale(2)).toBeCloseTo(574);
    });

    test('does not reserve disabled normal or hover markers', async () => {
        const args = await prepare([{...line, marker: {enabled: false}}], {
            line: {states: {hover: {marker: {enabled: false}}}},
        });
        args.xAxis.padding = allAuto;
        applyAxisPadding(args);
        expect(args.xScale.domain()).toEqual([0, 2]);
    });

    test('fits scatter hover halos and per-point radii', async () => {
        const args = await prepare([
            {
                type: 'scatter',
                name: 'Events',
                data: [
                    {x: 0, y: 0, radius: 20},
                    {x: 2, y: 100, radius: 8},
                ],
            },
        ]);
        args.xAxis.padding = allAuto;
        applyAxisPadding(args);
        expect(args.xScale(0)).toBeGreaterThanOrEqual(20);
        expect(args.xScale(2)).toBeLessThanOrEqual(592);
    });

    test.each(['area', 'area-range'] as const)('measures %s boundary markers', async (type) => {
        const raw: ChartSeries =
            type === 'area-range'
                ? {
                      type,
                      name: 'Range',
                      marker: {enabled: true, radius: 10},
                      data: [
                          {x: 0, y0: 0, y1: 100},
                          {x: 2, y0: 20, y1: 80},
                      ],
                  }
                : {type, name: 'Area', marker: {enabled: true, radius: 10}, data: line.data};
        const args = await prepare([raw]);
        args.yAxis[0].padding = allAuto;
        applyAxisPadding(args);
        expect(args.yScale[0](0)).toBeLessThanOrEqual(290);
        expect(args.yScale[0](100)).toBeGreaterThanOrEqual(10);
    });

    test('keeps axes independent within a split layout', async () => {
        const args = await prepare([
            line,
            {...line, name: 'Second', yAxis: 1, marker: {enabled: true, radius: 30}},
        ]);
        args.yAxis[0].padding = allAuto;
        args.yAxis.push({...args.yAxis[0], plotIndex: 1});
        args.split.plots.push({...args.split.plots[0], top: 320});
        args.yScale.push(args.yScale[0].copy());
        applyAxisPadding(args);
        expect(args.yScale[0](100)).toBeCloseTo(13);
        expect(args.yScale[1](100)).toBeGreaterThanOrEqual(30);
    });

    test.each(['datetime', 'logarithmic'] as const)(
        'expands the domain of a %s axis without changing its range',
        async (type) => {
            const args = await prepare([
                {
                    ...line,
                    data: [
                        {x: 1, y: 0},
                        {x: 100, y: 100},
                    ],
                },
            ]);
            args.xAxis.type = type;
            args.xAxis.padding = allAuto;
            const xScale =
                type === 'datetime'
                    ? scaleUtc()
                          .domain([new Date(1), new Date(100)])
                          .range([0, 600])
                    : scaleLog().domain([1, 100]).range([0, 600]);
            applyAxisPadding({...args, xScale});
            expect(Number(xScale.domain()[0])).toBeLessThan(1);
            expect(Number(xScale.domain()[1])).toBeGreaterThan(100);
            expect(xScale.range()).toEqual([0, 600]);
            expect(xScale(1)).toBeGreaterThanOrEqual(12);
            expect(xScale(100)).toBeLessThanOrEqual(588);
        },
    );

    test('category domains and pixel ranges stay unchanged', async () => {
        const args = await prepare();
        args.xAxis.type = 'category';
        args.xAxis.categories = ['A', 'B'];
        args.xAxis.padding = {min: 40, max: 40};
        const xScale = scaleBand().domain(['A', 'B']).range([0, 600]);
        applyAxisPadding({...args, xScale});
        expect(xScale.domain()).toEqual(['A', 'B']);
        expect(xScale.range()).toEqual([0, 600]);
    });

    test.each(['logarithmic', 'datetime'] as const)(
        'backs off excessive padding to keep a usable %s scale',
        async (type) => {
            const args = await prepare();
            args.xAxis = {...args.xAxis, type, padding: {min: 600}};
            const xScale =
                type === 'logarithmic'
                    ? scaleLog().domain([1, 100]).range([0, 600])
                    : scaleUtc().domain([-1e14, 1e14]).range([0, 600]);
            const domain = xScale.domain().map(Number);
            applyAxisPadding({...args, xScale});
            expect(xScale.domain().map(Number).every(Number.isFinite)).toBe(true);
            expect(Number(xScale.domain()[0])).toBeLessThan(domain[0]);
            expect(Number(xScale.domain()[1])).toBe(domain[1]);
            expect(xScale(domain[0])).toBeGreaterThan(0);
            expect(xScale(domain[0])).toBeLessThan(600);
            expect(xScale(domain[1])).toBe(600);
        },
    );

    test.each([allAuto, {max: '0%'}, {min: '25%', max: '1%'}])(
        'ignores padding %j on a reversed category axis with percentage padding',
        async (padding) => {
            const args = await prepare();
            args.xAxis = {
                ...args.xAxis,
                type: 'category',
                categories: ['A', 'B', 'C'],
                order: 'reverse',
                padding: {max: '50%'},
            };
            const common = {...args, boundsWidth: 600, boundsHeight: 300};
            const original = createScales(common).xScale;
            args.xAxis.padding = padding;
            const padded = createScales(common).xScale;
            expect(padded?.domain()).toEqual(original?.domain());
            expect(padded?.range()).toEqual(original?.range());
            expect(padded?.range()).toEqual([600, 0]);
        },
    );

    test.each(['bar-x', 'bar-y', 'area'] as const)(
        'does not extend the normalized axis of percent %s',
        async (type) => {
            const args = await prepare([
                {
                    type,
                    name: 'Share',
                    stacking: 'percent',
                    data: [
                        {x: 1, y: 10},
                        {x: 2, y: 20},
                    ],
                },
            ]);
            args.xScale.domain([0, 100]);
            args.xAxis.padding = {min: 40, max: 40};
            args.yAxis[0].padding = {min: 40, max: 40};
            applyAxisPadding(args);
            expect((type === 'bar-y' ? args.xScale : args.yScale[0]).domain()).toEqual([0, 100]);
        },
    );

    test.each(['bar-x', 'bar-y', 'area'] as const)(
        'keeps the percent %s fallback domain when all series are hidden',
        async (type) => {
            const args = await prepare([
                {
                    type,
                    name: 'Share',
                    stacking: 'percent',
                    visible: false,
                    data: [
                        {x: 1, y: 10},
                        {x: 2, y: 20},
                    ],
                },
            ]);
            args.xAxis.padding = {min: 30, max: 30};
            args.yAxis[0].padding = {min: 30, max: 30};
            const scales = createScales({...args, boundsWidth: 600, boundsHeight: 300});
            expect((type === 'bar-y' ? scales.xScale : scales.yScale[0])?.domain()).toEqual([
                0, 100,
            ]);
        },
    );

    test('skips geometry measurement when auto padding only affects a fixed percent domain', async () => {
        const args = await prepare([
            {
                type: 'area',
                name: 'Share',
                stacking: 'percent',
                data: [
                    {x: 0, y: 10},
                    {x: 2, y: 20},
                ],
            },
        ]);
        args.yAxis[0].padding = allAuto;
        const measurement = jest.spyOn(getSeriesPlugin('area'), 'getAxisPadding');
        try {
            applyAxisPadding(args);
            expect(measurement).not.toHaveBeenCalled();
            // Padding the non-normalized X axis still needs marker geometry.
            args.xAxis.padding = allAuto;
            applyAxisPadding(args);
            expect(measurement).toHaveBeenCalledTimes(1);
        } finally {
            measurement.mockRestore();
        }
    });

    test.each([0, 0.5, 100])(
        'keeps finite scales with width %s and oversized padding',
        async (width) => {
            const args = await prepare();
            args.xScale.range([0, width]);
            args.xAxis.padding = {min: Number.MAX_VALUE, max: '200%'};
            applyAxisPadding(args);
            expect(args.xScale.domain().every(Number.isFinite)).toBe(true);
            expect(args.xScale.range()).toEqual([0, width]);
            expect(args.xScale.domain()[0]).toBeLessThan(args.xScale.domain()[1]);
        },
    );

    test('rounds expanded free limits to ticks while preserving the other explicit limit', async () => {
        const args = await prepare();
        args.yAxis[0] = {...args.yAxis[0], min: 0, padding: allAuto, endOnTick: true};
        applyAxisPadding(args);
        expect(args.yScale[0].domain()).toEqual([0, 110]);
        expect(args.yScale[0].ticks()).toContain(110);
    });

    test('rounds to a visible tick even when a short Y axis thins its labels', async () => {
        const args = await prepare();
        args.yScale[0].range([80, 0]);
        args.yAxis[0] = {...args.yAxis[0], min: 0, padding: {max: 'auto'}, endOnTick: true};
        applyAxisPadding(args);
        const ticks = getAutomaticTickValues({
            axis: args.yAxis[0],
            scale: args.yScale[0],
            labelLineHeight: 12,
            series: args.series,
        });
        expect(ticks[ticks.length - 1].y).toBe(0);
        expect(args.yScale[0](100)).toBeGreaterThanOrEqual(13);
    });

    test('rechecks tick alignment when the expanded domain changes label thinning', async () => {
        const args = await prepare();
        args.yScale[0].domain([0, 2]).range([100, 0]);
        args.yAxis[0] = {...args.yAxis[0], min: 0, padding: {max: 13}, endOnTick: true};
        applyAxisPadding(args);
        const ticks = getAutomaticTickValues({
            axis: args.yAxis[0],
            scale: args.yScale[0],
            labelLineHeight: args.yAxis[0].labels.lineHeight,
            series: args.series,
        });
        expect(ticks[ticks.length - 1].y).toBe(0);
        expect(args.yScale[0](2)).toBeGreaterThanOrEqual(13);
        expect(args.yScale[0].domain()[0]).toBe(0);
    });

    test('aligns both padded boundaries to fractional ticks without floating-point drift', async () => {
        const args = await prepare();
        args.yScale[0].domain([1 / 3, 1]);
        args.yAxis[0] = {
            ...args.yAxis[0],
            padding: {min: 13, max: 13},
            startOnTick: true,
            endOnTick: true,
        };
        applyAxisPadding(args);
        const ticks = getAutomaticTickValues({
            axis: args.yAxis[0],
            scale: args.yScale[0],
            labelLineHeight: args.yAxis[0].labels.lineHeight,
            series: args.series,
        });
        expect(ticks[0].y).toBe(300);
        expect(ticks[ticks.length - 1].y).toBe(0);
        expect(args.yScale[0](1 / 3)).toBeLessThanOrEqual(287);
        expect(args.yScale[0](1)).toBeGreaterThanOrEqual(13);
    });

    test.each(['linear', 'logarithmic'] as const)(
        'keeps a padded logarithmic secondary axis usable beside a %s primary axis',
        async (primaryType) => {
            const args = await prepare([
                {
                    ...line,
                    data: [
                        {x: 0, y: 1},
                        {x: 2, y: 100},
                    ],
                },
                {
                    ...line,
                    name: 'Secondary',
                    yAxis: 1,
                    data: [
                        {x: 0, y: 100},
                        {x: 2, y: 200},
                    ],
                },
            ]);
            args.yAxis[0] = {
                ...args.yAxis[0],
                type: primaryType,
                startOnTick: true,
                endOnTick: true,
                position: 'left',
            };
            args.yAxis.push({
                ...args.yAxis[0],
                type: 'logarithmic',
                position: 'right',
                padding: {max: 10},
            });
            const scales = createScales({...args, boundsWidth: 600, boundsHeight: 300});
            const scale = scales.yScale[1];
            if (!scale || !('invert' in scale)) throw new Error('Expected a continuous scale');
            expect(
                scale
                    .domain()
                    .map(Number)
                    .every((value) => value > 0 && Number.isFinite(value)),
            ).toBe(true);
            expect(Number.isFinite(scale(100))).toBe(true);
            expect(scale(200)).toBeGreaterThanOrEqual(10);
        },
    );

    test.each([{height: 80}, {height: 150}, {height: 300}, {height: 300, padding: allAuto}])(
        'keeps the secondary Y grid aligned with %j after padding changes primary ticks',
        async ({height, padding}) => {
            const args = await prepare([
                line,
                {
                    ...line,
                    name: 'Secondary',
                    yAxis: 1,
                    data: [
                        {x: 0, y: 0},
                        {x: 2, y: 1000},
                    ],
                },
            ]);
            args.yAxis[0] = {
                ...args.yAxis[0],
                position: 'left',
                padding: {max: 'auto'},
                startOnTick: true,
                endOnTick: true,
            };
            args.yAxis.push({...args.yAxis[0], position: 'right', padding});
            const scales = createScales({...args, boundsWidth: 600, boundsHeight: height});
            const positions = args.yAxis.map((axis, index) => {
                const scale = scales.yScale[index];
                if (!scale) throw new Error('Expected a Y scale');
                return getAutomaticTickValues({
                    axis,
                    scale,
                    labelLineHeight: 12,
                    series: args.series.filter((s) => 'yAxis' in s && s.yAxis === index),
                }).map((t) => Math.round(t.y));
            });
            expect(positions[1]).toEqual(positions[0]);
            if (padding) {
                const secondary = scales.yScale[1];
                if (!secondary || !('invert' in secondary))
                    throw new Error('Expected a continuous scale');
                expect(secondary(0)).toBeLessThanOrEqual(height - 13);
                expect(secondary(1000)).toBeGreaterThanOrEqual(13);
            }
        },
    );

    test('zoom and range selection prevent automatic expansion', async () => {
        const args = await prepare();
        args.xAxis.padding = allAuto;
        args.yAxis[0].padding = allAuto;
        const common = {...args, boundsWidth: 600, boundsHeight: 300};
        const zoom = createScales({...common, zoomState: {x: [0, 1], y: [[0, 50]]}});
        expect(zoom.xScale?.domain()).toEqual([0, 1]);
        expect(zoom.yScale[0]?.domain()).toEqual([0, 50]);
        const selection = createScales({...common, rangeSliderState: {min: 0.5, max: 1.5}});
        expect(selection.xScale?.domain()).toEqual([0.5, 1.5]);
        const preview = createScales({...common, isRangeSlider: true});
        expect(preview.xScale?.domain()).toEqual([0, 2]);
        expect(preview.yScale[0]?.domain()).toEqual([0, 100]);
    });

    test('lets maximum padding be disabled independently of minimum padding', async () => {
        const args = await prepare();
        args.xAxis.padding = {max: '20%'};
        args.yAxis[0].padding = {max: '20%'};
        const common = {...args, boundsWidth: 600, boundsHeight: 300};
        const initial = createScales(common);
        expect(initial.xScale?.domain()).toEqual([0, 2.4]);
        expect(initial.yScale[0]?.domain()).toEqual([0, 120]);
        args.xAxis.padding = {max: 0};
        args.yAxis[0].padding = {min: 0, max: '20%'};
        const override = createScales(common);
        expect(override.xScale?.domain()).toEqual([0, 2]);
        expect(override.yScale[0]?.domain()).toEqual([0, 120]);
    });

    test.each([-1, NaN, Infinity, '2em', '10', '-1px', '1e3px', ' 5%', null, true])(
        'rejects invalid new padding %j',
        (value) => {
            expect(() =>
                validateData({
                    xAxis: {padding: {max: value} as ChartAxisPadding},
                    series: {data: [line]},
                }),
            ).toThrow();
        },
    );
});
