/** @jest-environment jsdom */

import {scaleBand, scaleLinear} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PreparedAreaRangeSeries, PreparedSeriesOptions} from '~core/series/types';
import {formatAreaRangeDataLabel} from '~core/shapes/area-range/format';
import {getTooltipData} from '~core/shapes/area-range/get-tooltip-data';
import {prepareAreaRangeData} from '~core/shapes/area-range/prepare-data';
import {renderAreaRange} from '~core/shapes/area-range/renderer';
import {getRangeBBox} from '~core/shapes/area-range/utils';
import {getDomainDataXBySeries} from '~core/utils/common';

import type {AreaRangeSeriesData} from '../../../types';
import {areaRangePlugin} from '../index';

function createSeries(data: AreaRangeSeriesData[]): PreparedAreaRangeSeries {
    return {
        color: '#5282ff',
        data,
        dataLabels: {
            allowOverlap: false,
            enabled: false,
            html: false,
            padding: 0,
            style: {},
        },
        fillColor: '#5282ff',
        id: 'area-range',
        lineWidth: 1,
        name: 'Area range',
        nullMode: 'skip',
        opacity: 0.75,
        type: 'area-range',
        visible: true,
        yAxis: 0,
    } as PreparedAreaRangeSeries;
}

function createArgs(data: AreaRangeSeriesData[]) {
    return {
        series: [createSeries(data)],
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 4]).range([0, 400]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 40]).range([200, 0])],
        split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
        isOutsideBounds: (x: number, y: number) => x < 0 || x > 400 || y < 0 || y > 200,
    };
}

describe('area-range plugin', () => {
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
