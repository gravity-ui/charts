import {scaleBand, scaleLinear} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PreparedAreaRangeSeries} from '~core/series/types';
import {formatAreaRangeDataLabel} from '~core/shapes/area-range/format';
import {prepareAreaRangeData} from '~core/shapes/area-range/prepare-data';

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
        ).toBe('formatted:5 – formatted:10');
        expect(formatter).toHaveBeenNthCalledWith(1, {value: 5});
        expect(formatter).toHaveBeenNthCalledWith(2, {value: 10});
    });
});
