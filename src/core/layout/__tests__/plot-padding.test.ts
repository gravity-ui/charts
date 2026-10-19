/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {createScales} from '../../../hooks/useAxisScales';
import {getShapes} from '../../../hooks/useShapes';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import {getPreparedOptions} from '../../series/prepare-options';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLegend, PreparedSeries} from '../../series/types';
import type {PreparedLineData} from '../../shapes/line/types';
import {getScatterMarkerBounds} from '../../shapes/scatter/marker-bounds';
import type {PreparedScatterShapeData} from '../../shapes/scatter/types';
import type {ChartPlotPadding, ChartSeries, ChartSeriesOptions} from '../../types';
import {getChartClosest, getClosestPoints} from '../../utils/get-closest-data';
import {getSymbolBounds} from '../../utils/symbol';
import {validateData} from '../../validation';
import {applyPlotPadding} from '../plot-padding';
import type {PreparedSplit} from '../split-types';

const allAuto: ChartPlotPadding = {left: 'auto', right: 'auto', top: 'auto', bottom: 'auto'};
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
        xAxis: {type: 'linear', min: 0, max: 2, maxPadding: 0} as PreparedXAxis,
        yAxis: [{type: 'linear', plotIndex: 0, min: 0, max: 100, maxPadding: 0}] as PreparedYAxis[],
        xScale: scaleLinear().domain([0, 2]).range([0, 600]),
        yScale: [scaleLinear().domain([0, 100]).range([300, 0])],
        split: {plots: [{top: 0, height: 300}], gap: 0} as PreparedSplit,
        width: 600,
        height: 300,
    };
}

describe('plot padding', () => {
    test.each([undefined, {}, {right: 0}, {right: '0px'}, {right: '0%'}])(
        'keeps the default layout for %j',
        async (options) => {
            const args = await prepare(undefined, {line: {plotPadding: allAuto}});
            applyPlotPadding({...args, options});
            expect(args.xScale.range()).toEqual([0, 600]);
            expect(args.yScale[0].range()).toEqual([300, 0]);
        },
    );

    test('fits the painted marker, preserves domains, and does not mutate config', async () => {
        const args = await prepare();
        const before = JSON.stringify(args.series);
        expect(applyPlotPadding({...args, options: allAuto})).toEqual([
            {left: 13, right: 13, top: 13, bottom: 13},
        ]);
        expect(args.xScale.range()).toEqual([13, 587]);
        expect(args.yScale[0].range()).toEqual([287, 13]);
        expect(args.xScale.domain()).toEqual([0, 2]);
        expect(args.yScale[0].domain()).toEqual([0, 100]);
        expect(JSON.stringify(args.series)).toBe(before);
    });

    test('reserves eligible hover geometry before interaction', async () => {
        const args = await prepare(undefined, {
            line: {states: {hover: {marker: {radius: 20, borderWidth: 4}}}},
        });
        applyPlotPadding({...args, options: {right: 'auto'}});
        expect(args.xScale.range()).toEqual([0, 574]);
        const disabled = await prepare(undefined, {
            line: {states: {hover: {enabled: false, marker: {radius: 20, borderWidth: 4}}}},
        });
        applyPlotPadding({...disabled, options: {right: 'auto'}});
        expect(disabled.xScale.range()).toEqual([0, 587]);
    });

    test('uses explicit replacements and pre-padding percentage dimensions', async () => {
        const args = await prepare(undefined, {line: {plotPadding: {right: '10%', left: 0}}});
        applyPlotPadding({...args, options: {...allAuto, bottom: '20px', top: '10%'}});
        expect(args.xScale.range()).toEqual([0, 540]);
        expect(args.yScale[0].range()).toEqual([280, 30]);
        const forced = await prepare(undefined, {line: {plotPadding: {right: 100}}});
        applyPlotPadding({...forced, options: {right: 6}});
        expect(forced.xScale.range()).toEqual([0, 594]);
    });

    test('subtracts existing zoom room and solves the changed range without relayout', async () => {
        const args = await prepare();
        args.xScale.range([12, 588]);
        applyPlotPadding({...args, options: {left: 'auto', right: 'auto'}});
        expect(args.xScale.range()).toEqual([13, 587]);
        const paddedDomain = await prepare();
        paddedDomain.xScale.domain([-1, 3]);
        applyPlotPadding({...paddedDomain, options: {left: 'auto', right: 'auto'}});
        expect(paddedDomain.xScale.range()).toEqual([0, 600]);
    });

    test.each([0.01, 0.2])(
        'composes auto with actual X/Y maxPadding=%s domains',
        async (maxPadding) => {
            const args = await prepare();
            args.xAxis = {
                ...args.xAxis,
                max: undefined,
                maxPadding,
                startOnTick: false,
                endOnTick: false,
            };
            args.yAxis[0] = {...args.yAxis[0], max: undefined, maxPadding};
            const base = {...args, boundsWidth: 600, boundsHeight: 300};
            const plain = createScales(base);
            const padded = createScales({...base, plotPadding: {right: 'auto', top: 'auto'}});
            expect(plain.xScale?.domain()).toEqual([0, 2 * (1 + maxPadding)]);
            expect(plain.yScale[0]?.domain()).toEqual([0, 100 * (1 + maxPadding)]);
            expect(padded.xScale?.domain()).toEqual(plain.xScale?.domain());
            expect(padded.yScale[0]?.domain()).toEqual(plain.yScale[0]?.domain());
            if (maxPadding === 0.2) {
                expect(padded.xScale?.range()).toEqual(plain.xScale?.range());
                expect(padded.yScale[0]?.range()).toEqual(plain.yScale[0]?.range());
            } else {
                expect((padded.xScale as typeof args.xScale)(2)).toBeCloseTo(600 - 13);
                expect((padded.yScale[0] as typeof args.xScale)(100)).toBeCloseTo(13);
                expect(padded.plotPadding?.[0].right).toBeGreaterThan(0);
                expect(padded.plotPadding?.[0].right).toBeLessThan(13);
                expect(padded.plotPadding?.[0].top).toBeGreaterThan(0);
                expect(padded.plotPadding?.[0].top).toBeLessThan(13);
            }
        },
    );

    test('explicit X/Y limits suppress maxPadding without suppressing plot padding', async () => {
        const args = await prepare();
        args.xAxis = {...args.xAxis, maxPadding: 0.2, startOnTick: false, endOnTick: false};
        args.yAxis[0] = {...args.yAxis[0], maxPadding: 0.2};
        const base = {...args, boundsWidth: 600, boundsHeight: 300};
        const plain = createScales(base);
        const padded = createScales({...base, plotPadding: allAuto});
        expect(padded.xScale?.domain()).toEqual([0, 2]);
        expect(padded.yScale[0]?.domain()).toEqual([0, 100]);
        expect(plain.xScale?.range()).toEqual([0, 600]);
        expect(plain.yScale[0]?.range()).toEqual([300, 0]);
        expect(padded.xScale?.range()).toEqual([13, 587]);
        expect(padded.yScale[0]?.range()).toEqual([287, 13]);
    });

    test('explicit plot padding adds to axis spacing while zero preserves that spacing', async () => {
        const args = await prepare();
        args.xAxis = {
            ...args.xAxis,
            max: undefined,
            maxPadding: 0.2,
            startOnTick: false,
            endOnTick: false,
        };
        args.yAxis[0] = {...args.yAxis[0], max: undefined, maxPadding: 0.2};
        const base = {...args, boundsWidth: 600, boundsHeight: 300};
        const plain = createScales(base);
        const explicit = createScales({...base, plotPadding: {right: 20, top: 20}});
        const zero = createScales({...base, plotPadding: {right: 0, top: 0}});
        expect(explicit.xScale?.domain()).toEqual(plain.xScale?.domain());
        expect(explicit.yScale[0]?.domain()).toEqual(plain.yScale[0]?.domain());
        expect(explicit.xScale?.range()).toEqual([0, 580]);
        expect(explicit.yScale[0]?.range()).toEqual([300, 20]);
        expect(zero.xScale?.domain()).toEqual(plain.xScale?.domain());
        expect(zero.yScale[0]?.domain()).toEqual(plain.yScale[0]?.domain());
        expect(zero.xScale?.range()).toEqual(plain.xScale?.range());
        expect(zero.yScale[0]?.range()).toEqual(plain.yScale[0]?.range());
    });

    test.each([false, true])(
        'preserves existing tick rounding with startOnTick/endOnTick=%s',
        async (round) => {
            const args = await prepare();
            args.xAxis = {
                ...args.xAxis,
                min: 0.03,
                max: 2.03,
                startOnTick: round,
                endOnTick: round,
            };
            const base = {...args, boundsWidth: 600, boundsHeight: 300};
            const plain = createScales(base);
            const padded = createScales({...base, plotPadding: {left: 'auto', right: 'auto'}});
            expect(plain.xScale?.domain()).toEqual(round ? [0, 2.2] : [0.03, 2.03]);
            expect(padded.xScale?.domain()).toEqual(plain.xScale?.domain());
        },
    );

    test('accepts plot padding together with axis limits, domain padding and zoom', () => {
        expect(() =>
            validateData({
                chart: {plotPadding: allAuto, zoom: {enabled: true, type: 'xy'}},
                xAxis: {min: 0, max: 2, maxPadding: 0.2},
                yAxis: [{min: 0, max: 100, maxPadding: 0.2}],
                series: {data: [line]},
            }),
        ).not.toThrow();
    });

    test('does not reserve hidden or out-of-domain markers', async () => {
        const args = await prepare([{...line, visible: false}]);
        applyPlotPadding({...args, options: allAuto});
        expect(args.xScale.range()).toEqual([0, 600]);
        const outside = await prepare([
            {
                ...line,
                data: [
                    {x: -1, y: 0},
                    {x: 3, y: 100},
                ],
            },
        ]);
        applyPlotPadding({...outside, options: allAuto});
        expect(outside.xScale.range()).toEqual([0, 600]);
    });

    test('aggregates plugins by maximum and allows opting a type out', async () => {
        const raw: ChartSeries[] = [
            line,
            {
                type: 'area-range',
                name: 'Range',
                marker: {enabled: true, radius: 20, borderWidth: 0},
                data: [
                    {x: 0, y0: 0, y1: 100},
                    {x: 2, y0: 0, y1: 100},
                ],
            },
        ];
        const args = await prepare(raw, {'area-range': {states: {hover: {enabled: false}}}});
        applyPlotPadding({...args, options: allAuto});
        expect(args.xScale.range()).toEqual([20, 580]);
        const optedOut = await prepare(raw, {'area-range': {plotPadding: {right: 0}}});
        applyPlotPadding({...optedOut, options: {right: 'auto'}});
        expect(optedOut.xScale.range()).toEqual([0, 587]);
    });

    test('uses projected stacked area coordinates', async () => {
        const args = await prepare(
            [0, 1].map((i) => ({
                type: 'area',
                name: String(i),
                stacking: 'normal',
                marker: {enabled: true, radius: 10, borderWidth: 2},
                data: [
                    {x: 0, y: 50},
                    {x: 2, y: 50},
                ],
            })),
        );
        applyPlotPadding({...args, options: {top: 'auto'}});
        expect(args.yScale[0].range()).toEqual([300, 13]);
    });

    test('uses scatter point radii and eligible halo geometry', async () => {
        const args = await prepare([
            {
                type: 'scatter',
                name: 'Events',
                data: [
                    {x: 0, y: 0, radius: 20},
                    {x: 2, y: 100, radius: 20},
                ],
            },
        ]);
        const series = args.series[0];
        if (series.type !== 'scatter') throw new Error('Expected scatter');
        const {normal, hover} = series.marker.states;
        const extent = Math.max(
            20 + normal.borderWidth * 1.5,
            20 + hover.borderWidth * 1.5,
            20 + hover.halo.size,
        );
        applyPlotPadding({...args, options: allAuto});
        expect(args.xScale.range()).toEqual([extent, 600 - extent]);
    });

    test('accounts for asymmetric symbol bounds and reversed scales', async () => {
        const args = await prepare(
            [{...line, marker: {enabled: true, radius: 10, borderWidth: 2, symbol: 'triangle'}}],
            {line: {states: {hover: {enabled: false}}}},
        );
        const bounds = getSymbolBounds({symbolType: 'triangle', radius: 12, strokeWidth: 2});
        args.xScale.range([600, 0]);
        args.yScale[0].range([0, 300]);
        applyPlotPadding({...args, options: allAuto});
        expect(args.xScale.range()[0]).toBeCloseTo(600 - bounds.right);
        expect(args.yScale[0].range()[0]).toBeCloseTo(bounds.top);
        expect(args.yScale[0].range()[1]).toBeCloseTo(300 - bounds.bottom);
    });

    test.each([
        {enabled: false, opacity: 1},
        {enabled: true, opacity: 0},
    ])('does not reserve an invisible halo: %j', async (halo) => {
        const args = await prepare(
            [{type: 'scatter', name: 'Events', data: [{x: 2, y: 50, radius: 10}]}],
            {scatter: {states: {hover: {marker: {borderWidth: 2, halo: {...halo, size: 100}}}}}},
        );
        applyPlotPadding({...args, options: {right: 'auto'}});
        expect(args.xScale.range()).toEqual([0, 587]);
    });

    test('uses category band room before reserving marker space', async () => {
        const args = await prepare([
            {
                ...line,
                data: [
                    {x: 0, y: 0},
                    {x: 1, y: 100},
                ],
            },
        ]);
        args.xAxis = {type: 'category', categories: ['A', 'B']} as PreparedXAxis;
        const xScale = scaleBand().domain(['A', 'B']).range([0, 600]);
        applyPlotPadding({...args, xScale, options: allAuto});
        expect(xScale.range()).toEqual([0, 600]);
    });

    test.each([-20, 0, 10, 600])(
        'keeps finite ordered ranges at width %s with oversized padding',
        async (width) => {
            const args = await prepare();
            args.xScale.range([0, width]);
            applyPlotPadding({...args, width, options: {left: Number.MAX_VALUE, right: '200%'}});
            const range = args.xScale.range();
            expect(range.every(Number.isFinite)).toBe(true);
            expect(range[0]).toBeGreaterThanOrEqual(0);
            expect(range[1]).toBeGreaterThanOrEqual(range[0]);
            expect(range[1]).toBeLessThanOrEqual(Math.max(0, width));
        },
    );

    test('keeps each split plot vertical contribution independent', async () => {
        const args = await prepare([
            line,
            {
                ...line,
                name: 'Second',
                yAxis: 1,
                marker: {enabled: true, radius: 30, borderWidth: 2},
            },
        ]);
        args.yAxis.push({...args.yAxis[0], plotIndex: 1});
        args.yScale.push(args.yScale[0].copy());
        args.split.plots.push({...args.split.plots[0], top: 320});
        applyPlotPadding({...args, options: allAuto});
        expect(args.xScale.range()).toEqual([33, 567]);
        expect(args.yScale.map((scale) => scale.range())).toEqual([
            [287, 13],
            [267, 33],
        ]);
    });

    test('uses each split plot height for percentage insets', async () => {
        const args = await prepare([line, {...line, name: 'Second', yAxis: 1}]);
        args.yAxis.push({...args.yAxis[0], plotIndex: 1});
        args.yScale.push(args.yScale[0].copy());
        args.split.plots.push({...args.split.plots[0], top: 400, height: 200});
        applyPlotPadding({...args, options: {top: '10%', bottom: '10%'}});
        expect(args.yScale.map((scale) => scale.range())).toEqual([
            [270, 30],
            [180, 20],
        ]);
    });

    test('keeps zero at the Y axis when only right padding is enabled in a mixed chart', async () => {
        const args = await prepare([line, {type: 'bar-y', name: 'Plan', data: [{x: 2, y: 50}]}]);
        const scales = createScales({
            ...args,
            boundsWidth: args.width,
            boundsHeight: args.height,
            plotPadding: {left: 0, right: 'auto'},
        });
        expect(scales.xScale?.range()[0]).toBe(0);
        expect((scales.xScale as typeof args.xScale)(0)).toBe(0);
        expect(scales.xScale?.range()[1]).toBe(587);
    });

    test('excludes inset outliers from markers, tooltip and nearest-point selection', async () => {
        const outside = {x: 2.05, y: 100};
        const args = await prepare([{...line, data: [...line.data, outside]}]);
        const plotPadding = applyPlotPadding({...args, options: {right: 40}});
        const {shapesData} = await getShapes({
            ...args,
            boundsWidth: 600,
            boundsHeight: 300,
            plotPadding,
            clipPathId: 'padding-test',
            htmlLayout: null,
        });
        expect((shapesData[0] as PreparedLineData).markers.map((marker) => marker.clipped)).toEqual(
            [false, false, true],
        );
        const selection = {
            shapesData,
            boundsWidth: 600,
            boundsHeight: 300,
            position: [590, 0] as [number, number],
        };
        expect(getClosestPoints(selection).map((item) => item.data)).not.toContain(outside);
        expect(
            getChartClosest({
                ...selection,
                mode: 'chart',
                seriesOrder: args.series.map((item) => item.id),
            })?.point,
        ).not.toBe(outside);
    });

    test('retains a partially visible range whose midpoint is outside the padded plot', async () => {
        const point = {x: 1, y0: 50, y1: 200};
        const args = await prepare([{type: 'area-range', name: 'Range', data: [point]}]);
        const plotPadding = applyPlotPadding({...args, options: {top: 20, bottom: 20}});
        const {shapesData} = await getShapes({
            ...args,
            boundsWidth: 600,
            boundsHeight: 300,
            plotPadding,
            clipPathId: 'range-padding-test',
            htmlLayout: null,
        });
        expect(
            getChartClosest({
                shapesData,
                boundsWidth: 600,
                boundsHeight: 300,
                position: [300, 30],
                mode: 'chart',
                seriesOrder: args.series.map((item) => item.id),
            })?.point,
        ).toBe(point);
    });

    test('keeps shifted cluster hover contours inside the plot', async () => {
        const args = await prepare(
            [
                {
                    type: 'scatter',
                    name: 'Events',
                    cluster: {
                        enabled: true,
                        overlapMode: 'shift',
                        layoutAlgorithm: {gridSize: 50},
                        marker: {radius: 12, borderWidth: 1},
                        dataLabels: {enabled: false},
                    },
                    data: [47, 48, 52, 53].map((x) => ({x: x / 300, y: 90})),
                },
            ],
            {scatter: {states: {hover: {marker: {halo: {enabled: true, size: 28}}}}}},
        );
        const plotPadding = applyPlotPadding({...args, options: allAuto});
        const {shapes} = await getShapes({
            ...args,
            boundsWidth: 600,
            boundsHeight: 300,
            plotPadding,
            clipPathId: 'cluster-padding-test',
            htmlLayout: null,
        });
        const data = (shapes[0].props.preparedData[0] as PreparedScatterShapeData).scatterData;
        expect(data.filter((item) => item.point.data.cluster)).toHaveLength(2);
        for (const {point} of data) {
            const bounds = getScatterMarkerBounds(point.series, point.data.radius);
            expect(point.x - bounds.left).toBeGreaterThanOrEqual(-0.5);
            expect(point.y - bounds.top).toBeGreaterThanOrEqual(-0.5);
            expect(point.x + bounds.right).toBeLessThanOrEqual(600.5);
            expect(point.y + bounds.bottom).toBeLessThanOrEqual(300.5);
        }
    });

    test('keeps scale domains and range slider layout unchanged', async () => {
        const args = await prepare();
        const base = {...args, boundsWidth: args.width, boundsHeight: args.height};
        const plain = createScales(base);
        const padded = createScales({...base, plotPadding: allAuto});
        const slider = createScales({...base, plotPadding: allAuto, isRangeSlider: true});
        expect(padded.xScale?.domain()).toEqual(plain.xScale?.domain());
        expect(padded.yScale[0]?.domain()).toEqual(plain.yScale[0]?.domain());
        expect(slider.xScale?.range()).toEqual(plain.xScale?.range());
    });

    test.each([-1, Infinity, NaN, '-1px', '12', '1em', 'auto ', null, 'Infinity%'])(
        'rejects invalid size %s at both levels',
        (size) => {
            const plotPadding = {right: size} as ChartPlotPadding;
            expect(() => validateData({chart: {plotPadding}, series: {data: [line]}})).toThrow();
            for (const type of ['line', 'area', 'area-range', 'scatter'] as const) {
                const series: ChartSeries =
                    type === 'area-range'
                        ? {type, name: 'Range', data: [{x: 0, y0: 0, y1: 1}]}
                        : {type, name: 'Series', data: [{x: 0, y: 0}]};
                expect(() =>
                    validateData({series: {data: [series], options: {[type]: {plotPadding}}}}),
                ).toThrow();
            }
        },
    );
});
