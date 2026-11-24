/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {getWaterfallIntervals} from '../../../../plugins/waterfall/intervals';
import {prepareWaterfallSeries} from '../../../../plugins/waterfall/prepare-waterfall-series';
import type {WaterfallSeriesData} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import {seriesOptionsDefaults} from '../../../constants';
import {createXScale} from '../../../scales/x-scale';
import {createYScale} from '../../../scales/y-scale';
import type {PreparedLegend, PreparedWaterfallSeries} from '../../../series/types';
import {getVisibleSeries} from '../../../series/utils';
import {getZoomedSeriesData} from '../../../zoom';
import {prepareWaterfallData} from '../prepare-data';

async function prepareUnzoomedWaterfall(
    data: WaterfallSeriesData[],
    options: {xAxis?: PreparedXAxis; yOrder?: PreparedYAxis['order']} = {},
) {
    const {xAxis = {type: 'linear'} as PreparedXAxis, yOrder} = options;
    const yAxis = {type: 'linear', min: 0, max: 20, order: yOrder} as PreparedYAxis;
    const series = prepareWaterfallSeries({
        series: [{type: 'waterfall', name: 'Balance', data, dataLabels: {enabled: false}}],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    const xScale = createXScale({axis: xAxis, series, boundsWidth: 300});
    if (!xScale) throw new Error('X scale is unavailable');
    const yScale = createYScale({axis: yAxis, series, boundsHeight: 200});
    const shapes = await prepareWaterfallData({
        series,
        intervals: getWaterfallIntervals(series),
        seriesOptions: seriesOptionsDefaults,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    });

    return {xDomain: xScale.domain(), shapes};
}

test('unzoomed columns on a linear X axis use the numeric spacing of points', async () => {
    const {shapes} = await prepareUnzoomedWaterfall([
        {x: 2, y: 10},
        {x: 10, y: 5},
        {x: 100, y: -3},
        {x: 120, total: true},
    ]);

    expect(shapes.map(({width}) => width)).toEqual([16, 16, 16, 16]);
});

test('a single column on an unzoomed linear X axis is centered and uses the default maximum width', async () => {
    const {shapes} = await prepareUnzoomedWaterfall([{x: 5, y: 10}]);

    expect(shapes).toEqual([expect.objectContaining({x: 125, width: 50})]);
});

test('unzoomed columns use positive heights on a reversed Y axis', async () => {
    const {shapes} = await prepareUnzoomedWaterfall(
        [
            {x: 2, y: 10},
            {x: 10, y: -4},
            {x: 100, total: true},
        ],
        {yOrder: 'reverse'},
    );

    expect(shapes.map(({y, height}) => [y, y + height])).toEqual([
        [0, 100],
        [60, 100],
        [0, 60],
    ]);
});

test('a point without y retains its category and index position without interrupting the balance', async () => {
    const xAxis = {
        type: 'category',
        categories: ['Opening', 'Gap', 'Expense', 'Total'],
    } as PreparedXAxis;
    const data = [
        {x: 'Opening', y: 10},
        {x: 'Gap'},
        {x: 'Expense', y: -3},
        {x: 'Total', total: true},
    ];
    const {xDomain, shapes} = await prepareUnzoomedWaterfall(data, {xAxis});

    expect(xDomain).toEqual(['Opening', 'Gap', 'Expense', 'Total']);
    expect(shapes).toMatchObject([
        {data: {x: 'Opening', index: 0}, subTotal: 10},
        {data: {x: 'Expense', index: 2}, subTotal: 7, previousIndex: 0},
        {data: {x: 'Total', index: 3}, subTotal: 7, previousIndex: 2},
    ]);
});

test('a point without y contributes to the linear X domain without producing a column', async () => {
    const {xDomain, shapes} = await prepareUnzoomedWaterfall([
        {x: 0, y: 10},
        {x: 1, total: true},
        {x: 100},
    ]);

    expect(xDomain).toEqual([0, 100]);
    expect(shapes.map(({data}) => data.x)).toEqual([0, 1]);
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
        intervals: getWaterfallIntervals(series),
        seriesOptions: seriesOptionsDefaults,
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

test('a single column in a continuous X zoom uses its original Y interval for autoscaling', async () => {
    const series = prepareWaterfallSeries({
        series: [
            {
                type: 'waterfall',
                name: 'Balance',
                data: [
                    {x: 0, y: 100},
                    {x: 1, y: -20},
                    {x: 2, total: true},
                ],
                dataLabels: {enabled: false},
            },
        ],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    const xAxis = {type: 'linear'} as PreparedXAxis;
    const yAxis = {type: 'linear', padding: {min: 0, max: 0}} as PreparedYAxis;
    const zoomStateX: [number, number] = [0.5, 1.5];
    const {preparedShapesSeries} = getZoomedSeriesData({
        seriesData: series,
        xAxis,
        zoomState: {x: zoomStateX},
    });
    const xScale = createXScale({
        axis: xAxis,
        series: preparedShapesSeries,
        boundsWidth: 100,
        zoomStateX,
    });
    if (!xScale) throw new Error('X scale is unavailable');
    const yScale = createYScale({axis: yAxis, series: preparedShapesSeries, boundsHeight: 200});
    expect(yScale?.domain()).toEqual([0, 100]);

    const waterfallSeries = preparedShapesSeries as PreparedWaterfallSeries[];
    const shapes = await prepareWaterfallData({
        series: waterfallSeries,
        intervals: getWaterfallIntervals(waterfallSeries),
        seriesOptions: seriesOptionsDefaults,
        xAxis,
        xScale,
        yAxis: [yAxis],
        yScale: [yScale],
    });

    expect(shapes).toHaveLength(1);
    expect(shapes[0].y).toBeCloseTo(0);
    expect(shapes[0].height).toBeCloseTo(40);
    expect(shapes[0].width).toBeGreaterThan(0);
});

test('Y zoom tests column intervals for the current legend selection', () => {
    const series = prepareWaterfallSeries({
        series: [
            {
                type: 'waterfall',
                name: 'Balance',
                data: [
                    {x: 0, y: 100},
                    {x: 1, y: -20},
                    {x: 2, y: 25},
                    {x: 3, total: true},
                ],
            },
        ],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: true} as PreparedLegend,
    });
    const [positive, negative, totals] = series;
    const getZoomedXValues = (activeLegendItems: string[]) => {
        const {preparedShapesSeries} = getZoomedSeriesData({
            seriesData: getVisibleSeries({preparedSeries: series, activeLegendItems}),
            zoomState: {y: [[115, 120]]},
        });
        return (preparedShapesSeries as PreparedWaterfallSeries[]).flatMap(({data}) =>
            data.map((point) => point.x),
        );
    };

    const withoutExpenses = [positive.legend.groupId, totals.legend.groupId];
    expect(getZoomedXValues(withoutExpenses)).toEqual([2, 3]);
    expect(getZoomedXValues([...withoutExpenses, negative.legend.groupId])).toEqual([]);
});
