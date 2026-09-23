/** @jest-environment jsdom */

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';
import cloneDeep from 'lodash/cloneDeep';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {
    PreparedAreaRangeSeries,
    PreparedLegend,
    PreparedSeriesOptions,
} from '~core/series/types';
import {formatAreaRangeDataLabel} from '~core/shapes/area-range/format';
import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import {prepareAreaRangeData} from '~core/shapes/area-range/prepare-data';
import {renderAreaRange} from '~core/shapes/area-range/renderer';
import {getRangeBBox} from '~core/shapes/area-range/utils';
import {getDomainDataXBySeries} from '~core/utils/common';

import type {AreaRangeSeries, AreaRangeSeriesData, ChartSeriesOptions} from '../../../types';
import {areaRangePlugin} from '../index';
import {prepareAreaRangeSeries} from '../prepare-area-range-series';

function createSeries(
    data: AreaRangeSeriesData[],
    config: Partial<AreaRangeSeries> = {},
    seriesOptions?: ChartSeriesOptions,
): PreparedAreaRangeSeries {
    return prepareAreaRangeSeries({
        series: [{type: 'area-range', name: 'Area range', ...config, data}],
        seriesOptions,
        colors: [],
        colorScale: scaleOrdinal<string, string>().range(['#5282ff']),
        legend: {enabled: false} as PreparedLegend,
    })[0];
}

function createArgs(
    data: AreaRangeSeriesData[],
    config?: Partial<AreaRangeSeries>,
    seriesOptions?: ChartSeriesOptions,
) {
    return {
        series: [createSeries(data, config, seriesOptions)],
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 4]).range([0, 400]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 40]).range([200, 0])],
        split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
        isOutsideBounds: (x: number, y: number) => x < 0 || x > 400 || y < 0 || y > 200,
    };
}

describe('area-range plugin', () => {
    describe('boundary markers', () => {
        test('shows both hover boundaries by default for a real tooltip selection', async () => {
            const args = createArgs([{x: 1, y0: 5, y1: 10}]);
            const data = await prepareAreaRangeData(args);
            const selected =
                getTooltipData({data, position: [100, 160], boundsWidth: 400, boundsHeight: 200})
                    .xLookupPoints ?? [];
            expect(data[0].markers).toEqual([]);
            expect(
                data[0].getHoverMarkers(
                    selected.map((point) => ({...point, series: args.series[0]})),
                ),
            ).toEqual([
                expect.objectContaining({
                    cx: 100,
                    cy: 175,
                    radius: 4,
                    stroke: '#ffffff',
                    strokeWidth: 1,
                }),
                expect.objectContaining({
                    cx: 100,
                    cy: 150,
                    radius: 4,
                    stroke: '#ffffff',
                    strokeWidth: 1,
                }),
            ]);
            expect(data[0].getHoverMarkers([])).toEqual([]);
            expect(
                data[0].getHoverMarkers([
                    {data: args.series[0].data[0], series: {id: 'another-series'}},
                ]),
            ).toEqual([]);
        });

        test('normal markers use point colors and series fallback', async () => {
            const points: AreaRangeSeriesData[] = [
                {x: 0, y0: 5, y1: 10, color: 'green'},
                {x: 1, y0: 6, y1: 12, marker: {color: 'red', states: {normal: {enabled: false}}}},
                {x: 2, y0: 5, y1: 10},
            ];
            const options: ChartSeriesOptions = {
                'area-range': {marker: {enabled: true, radius: 9}},
            };
            const originalOptions = cloneDeep(options);
            const args = createArgs(points, {marker: {radius: 5, symbol: 'square'}}, options);
            const [result] = await prepareAreaRangeData(args);
            expect(result.markers).toHaveLength(6);
            expect(result.markers.map((marker) => marker.fill)).toEqual([
                'green',
                'red',
                '#5282ff',
                'green',
                'red',
                '#5282ff',
            ]);
            expect(
                result.markers.every(
                    (marker) => marker.radius === 5 && marker.symbolType === 'square',
                ),
            ).toBe(true);
            expect(result.getHoverMarkers([{data: points[0]}])).toEqual([]);
            expect(result.getHoverMarkers([{data: points[1]}])).toEqual([]);
            expect(options).toEqual(originalOptions);
        });

        test('point-only normal markers and hover options match area', async () => {
            const points: AreaRangeSeriesData[] = [
                {x: 1, y0: 5, y1: 10, marker: {color: 'red', states: {normal: {enabled: true}}}},
                {x: 2, y0: 5, y1: 10},
            ];
            const [disabled] = await prepareAreaRangeData(
                createArgs(
                    points,
                    {},
                    {'area-range': {states: {hover: {marker: {enabled: false}}}}},
                ),
            );
            expect(disabled.markers).toHaveLength(2);
            expect(disabled.markers.map((marker) => marker.fill)).toEqual(['red', 'red']);
            expect(disabled.getHoverMarkers([{data: points[1]}])).toEqual([]);

            const [custom] = await prepareAreaRangeData(
                createArgs(
                    points,
                    {},
                    {
                        'area-range': {
                            states: {
                                hover: {marker: {radius: 7, borderColor: 'green'}},
                            },
                        },
                    },
                ),
            );
            expect(custom.markers).toHaveLength(2);
            expect(custom.getHoverMarkers([{data: points[1]}])).toEqual([
                expect.objectContaining({fill: '#5282ff', radius: 7, stroke: 'green'}),
                expect.objectContaining({fill: '#5282ff', radius: 7, stroke: 'green'}),
            ]);
        });

        test('omits missing and off-screen boundaries and deduplicates a zero-width interval', async () => {
            const points: AreaRangeSeriesData[] = [
                {x: 0, y0: null, y1: 10},
                {x: 1, y0: -10, y1: 20},
                {x: 2, y0: 25, y1: 50},
                {x: 3, y0: 10, y1: 10},
                {x: 4, y0: 50, y1: 60},
                {x: 5, y0: 10, y1: 20},
            ];
            const args = createArgs(points, {marker: {enabled: true}});
            Object.assign(args.yAxis[0], {min: 0, max: 40});
            args.yScale[0].clamp(true);
            const [normal] = await prepareAreaRangeData(args);
            expect(normal.markers.map(({cx, cy}) => [cx, cy]).sort((a, b) => a[0] - b[0])).toEqual([
                [100, 100],
                [200, 75],
                [300, 150],
            ]);
            args.series[0].marker.states.normal.enabled = false;
            const [hover] = await prepareAreaRangeData(args);
            expect(
                hover
                    .getHoverMarkers(points.map((data) => ({data})))
                    .map(({cx, cy}) => [cx, cy])
                    .sort((a, b) => a[0] - b[0]),
            ).toEqual([
                [100, 100],
                [200, 75],
                [300, 150],
            ]);
        });

        test('uses each boundary gradient color and preserves explicit point colors', async () => {
            const points: AreaRangeSeriesData[] = [
                {x: 1, y0: 0, y1: 40},
                {x: 2, y0: 0, y1: 40, marker: {color: 'red'}},
            ];
            const [result] = await prepareAreaRangeData(
                createArgs(points, {
                    color: {
                        type: 'linear-gradient',
                        angle: 180,
                        stops: [
                            {offset: 0, color: '#000000'},
                            {offset: 1, color: '#ffffff'},
                        ],
                    },
                }),
            );
            expect(
                result.getHoverMarkers([{data: points[0]}]).map((marker) => marker.fill),
            ).toEqual(['#ffffff', '#000000']);
            expect(
                result.getHoverMarkers([{data: points[1]}]).map((marker) => marker.fill),
            ).toEqual(['red', 'red']);
            expect(result.points[1].data).toBe(points[1]);
        });
    });

    test('excludes incomplete points from the y domain', () => {
        const getYDomainValues = areaRangePlugin.getAxisDomainValues?.y;

        expect(getYDomainValues?.({x: 0, y0: null, y1: 10})).toEqual([]);
        expect(getYDomainValues?.({x: 1, y0: 5, y1: null})).toEqual([]);
        expect(getYDomainValues?.({x: 2, y0: 5, y1: 10})).toEqual([5, 10]);
    });

    test('orders points by their effective category positions', async () => {
        const categories = ['C', 'B', 'A'];
        const xScale = scaleBand<string>().domain(categories).range([0, 300]);
        const yScale = scaleLinear().domain([0, 40]).range([200, 0]);
        const data: AreaRangeSeriesData[] = [
            {x: 'A', y0: 10, y1: 20},
            {x: 'C', y0: 12, y1: 24},
            {x: 'B', y0: 8, y1: 18},
        ];
        const result = await prepareAreaRangeData({
            series: [createSeries(data)],
            xAxis: {type: 'category', categories} as PreparedXAxis,
            xScale,
            yAxis: [{type: 'linear', plotIndex: 0} as PreparedYAxis],
            yScale: [yScale],
            split: {plots: [{top: 0}]} as PreparedSplit,
            isOutsideBounds: () => false,
        });

        expect(result[0].points.map((point) => point.data.x)).toEqual(categories);
    });

    test('formats both data label boundaries independently', () => {
        const formatter = jest.fn(({value}) => `formatted:${value}`);

        expect(
            formatAreaRangeDataLabel({
                data: {x: 1, y0: 5, y1: 10},
                format: {type: 'custom', formatter},
            }),
        ).toBe('formatted:5 — formatted:10');
        expect(formatter).toHaveBeenNthCalledWith(1, {value: 5});
        expect(formatter).toHaveBeenNthCalledWith(2, {value: 10});
    });

    test.each(['skip', 'connect'] as const)(
        'renders partial nulls with nullMode=%s',
        async (nullMode) => {
            const args = createArgs([
                {x: 0, y0: 5, y1: 10},
                {x: 1, y0: 6, y1: 12},
                {x: 2, y0: 900, y1: null},
                {x: 3, y0: 8, y1: 16},
                {x: 4, y0: 9, y1: 18},
            ]);
            args.series[0].nullMode = nullMode;
            const data = await prepareAreaRangeData(args);
            const plot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            renderAreaRange({plot}, data, {} as PreparedSeriesOptions, false);
            const path = plot.querySelector('.gcharts-area-range__region')?.getAttribute('d');
            expect(path?.match(/M/g)).toHaveLength(nullMode === 'skip' ? 2 : 1);
            expect(path).not.toContain('NaN');
            expect(
                getTooltipData({
                    data,
                    position: [200, 100],
                    boundsWidth: 400,
                    boundsHeight: 200,
                }).xLookupPoints?.map((point) => point.data),
            ).toEqual(args.series[0].data.filter((point) => point.y1 !== null));
        },
    );

    test('partial nulls do not change gradient bounds or the colors of complete points', async () => {
        const complete = [
            {x: 1, y0: 5, y1: 10},
            {x: 3, y0: 15, y1: 20},
        ];
        const args = createArgs(complete);
        args.series[0].gradient = {
            type: 'linear-gradient',
            stops: [
                {offset: 0, color: '#000000'},
                {offset: 1, color: '#ffffff'},
            ],
        };
        const baseline = await prepareAreaRangeData(args);
        args.series[0].data = [{x: 0, y0: 900, y1: null}, ...complete, {x: 4, y0: null, y1: -900}];
        const result = await prepareAreaRangeData(args);
        expect(getRangeBBox(result[0].points)).toEqual(getRangeBBox(baseline[0].points));
        expect(
            result[0].points.filter((point) => point.y !== null).map((point) => point.fill),
        ).toEqual(baseline[0].points.map((point) => point.fill));
    });

    test.each([false, true])(
        'formats explicit labels without changing raw points (html=%s)',
        async (html) => {
            const data = [{x: 1, y0: 5, y1: 10, label: 1234.5678}];
            const args = createArgs(data);
            Object.assign(args.series[0].dataLabels, {
                enabled: true,
                html,
                format: {type: 'number', precision: 1},
            });
            const result = await prepareAreaRangeData(args);
            const text = html ? result[0].htmlLabels[0].content : result[0].svgLabels[0].text;
            expect(text).toBe('1\u00a0234,6');
            expect(result[0].points[0].data).toBe(data[0]);
            expect(data[0].label).toBe(1234.5678);
        },
    );

    test('formats each numeric boundary in rendered data labels', async () => {
        const args = createArgs([{x: 1, y0: 5.123, y1: 10.567}]);
        Object.assign(args.series[0].dataLabels, {
            enabled: true,
            format: {type: 'number', precision: 1},
        });
        const result = await prepareAreaRangeData(args);
        expect(result[0].svgLabels[0].text).toBe('5,1 — 10,6');
    });

    test('calls a custom label formatter once for an explicit label', async () => {
        const args = createArgs([{x: 1, y0: 5, y1: 10, label: 'custom'}]);
        const formatter = jest.fn(({value}) => `label:${value}`);
        Object.assign(args.series[0].dataLabels, {
            enabled: true,
            format: {type: 'custom', formatter},
        });
        const result = await prepareAreaRangeData(args);
        expect(result[0].svgLabels[0].text).toBe('label:custom');
        expect(formatter).toHaveBeenCalledTimes(1);
        expect(formatter).toHaveBeenCalledWith({value: 'custom'});
    });

    test('hides out-of-range tooltip points but keeps neighboring shape anchors', async () => {
        const args = createArgs([
            {x: 0, y0: 50, y1: 60},
            {x: 1, y0: 50, y1: 60},
            {x: 2, y0: 35, y1: 45},
            {x: 3, y0: -10, y1: 50},
            {x: 4, y0: -20, y1: -10},
        ]);
        Object.assign(args.yAxis[0], {min: 0, max: 40});
        const data = await prepareAreaRangeData(args);
        expect(data[0].points.map((point) => point.hiddenInLine)).toEqual([
            true,
            false,
            false,
            false,
            false,
        ]);
        expect(
            getTooltipData({
                data,
                position: [200, 100],
                boundsWidth: 400,
                boundsHeight: 200,
            }).xLookupPoints?.map((point) => (point.data as AreaRangeSeriesData).x),
        ).toEqual([2, 3]);
    });

    test('respects explicit Y limits even when a clamped scale maps outside points into the plot', async () => {
        const args = createArgs([
            {x: 1, y0: 50, y1: 60},
            {x: 2, y0: -20, y1: -10},
        ]);
        Object.assign(args.yAxis[0], {min: 0, max: 40});
        args.yScale[0].clamp(true);
        const data = await prepareAreaRangeData(args);
        expect(
            getTooltipData({data, position: [200, 100], boundsWidth: 400, boundsHeight: 200})
                .xLookupPoints,
        ).toEqual([]);
        expect(data[0].points.map((point) => point.hiddenInLine)).toEqual([false, false]);
    });

    test('x-range contributes both boundaries through the shared domain pipeline', () => {
        expect(
            getDomainDataXBySeries([
                {
                    type: 'x-range',
                    data: [
                        {x0: 10, x1: 20, y: 'A'},
                        {x0: 15, x1: 40, y: 'B'},
                    ],
                },
            ]),
        ).toEqual([10, 20, 15, 40]);
    });
});
