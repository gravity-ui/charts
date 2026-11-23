/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareWaterfallSeries} from '../../../../plugins/waterfall/prepare-waterfall-series';
import type {WaterfallSeriesData} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import type {PreparedLegend, PreparedWaterfallSeries} from '../../../series/types';
import * as textUtils from '../../../utils/text';
import {prepareWaterfallData} from '../prepare-data';

beforeEach(() => {
    jest.spyOn(textUtils, 'createLabelMeasurer').mockReturnValue(async () => ({
        width: 20,
        height: 10,
        hangingOffset: 2,
    }));
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('resolves totals without overwriting point values', async () => {
    const data: WaterfallSeriesData[] = [
        {x: 'Loss', y: -10},
        {x: 'Negative total', total: true, y: 100},
        {x: 'Income', y: 15},
        {x: 'Positive total', total: true, y: -100, label: 'Balance'},
        {x: 'Expense', y: -5},
        {x: 'Zero total', total: true},
    ];
    const originalData = JSON.stringify(data);
    const series = prepareWaterfallSeries({
        series: [{type: 'waterfall', name: 'Balance', data}],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedWaterfallSeries[];
    const originalSeries = JSON.stringify(series);
    const yScale = scaleLinear().domain([-20, 20]).range([400, 0]);
    const result = await prepareWaterfallData({
        series,
        seriesOptions: seriesOptionsDefaults,
        boundsWidth: 600,
        xAxis: {type: 'category', categories: data.map((d) => String(d.x))} as PreparedXAxis,
        xScale: scaleBand()
            .domain(data.map((d) => String(d.x)))
            .range([0, 600]),
        yAxis: [{type: 'linear'}] as PreparedYAxis[],
        yScale: [yScale],
    });

    expect(JSON.stringify(data)).toBe(originalData);
    expect(JSON.stringify(series)).toBe(originalSeries);
    expect(result.map((d) => d.data.y)).toEqual([-10, 100, 15, -100, -5, undefined]);
    expect(result.map((d) => d.subTotal)).toEqual([-10, -10, 5, 5, 0, 0]);
    expect(result.map((d) => [d.y, d.y + d.height])).toEqual([
        [yScale(0), yScale(-10)],
        [yScale(0), yScale(-10)],
        [yScale(5), yScale(-10)],
        [yScale(5), yScale(0)],
        [yScale(5), yScale(0)],
        [yScale(0), yScale(0)],
    ]);
    expect(result.map((d) => d.label?.text)).toEqual(['-10', '-10', '15', 'Balance', '-5', '0']);
    expect(result[1].label?.y).toBeGreaterThan(result[1].y + result[1].height);
    expect(result[3].label?.y).toBeLessThan(result[3].y);
    expect(result[5].label?.y).toBeLessThan(result[5].y);
});

test('keeps a zero-height label at the plot edge despite accumulated rounding', async () => {
    const data: WaterfallSeriesData[] = [
        {x: 'Opening', y: 6},
        {x: 'First decrease', y: -1},
        {x: 'Second decrease', y: -5},
        {x: 'At baseline', y: 0},
        {x: 'Below baseline', y: -1},
        {x: 'Off plot', y: 0},
    ];
    const categories = data.map((point) => String(point.x));
    const series = prepareWaterfallSeries({
        series: [{type: 'waterfall', name: 'Balance', data}],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedWaterfallSeries[];
    const plotHeight = 240;
    const boundsWidth = 600;
    const result = await prepareWaterfallData({
        series,
        seriesOptions: seriesOptionsDefaults,
        boundsWidth,
        xAxis: {type: 'category', categories} as PreparedXAxis,
        xScale: scaleBand().domain(categories).range([0, boundsWidth]),
        yAxis: [{type: 'linear'}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 7]).range([plotHeight, 0])],
    });

    const [, , , atBaseline, , offPlot] = result;
    expect(atBaseline.y).toBeCloseTo(plotHeight);
    expect(atBaseline.label?.text).toBe('0');
    expect(atBaseline.label?.y).toBeLessThan(plotHeight);
    expect(offPlot.label).toBeUndefined();
});
