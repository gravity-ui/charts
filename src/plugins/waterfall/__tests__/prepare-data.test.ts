/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import {seriesOptionsDefaults} from '~core/constants';
import {createXScale} from '~core/scales/x-scale';
import {createYScale} from '~core/scales/y-scale';
import type {PreparedLegend, PreparedWaterfallSeries} from '~core/series/types';
import {getVisibleSeries} from '~core/series/utils';
import * as textUtils from '~core/utils/text';
import {getZoomedSeriesData} from '~core/zoom';

import type {WaterfallSeries, WaterfallSeriesData} from '../../../types';
import {getWaterfallIntervals, resolveWaterfallIntervals} from '../intervals';
import {prepareWaterfallData} from '../prepare-data';
import {prepareWaterfallPoints, prepareWaterfallSeries} from '../prepare-waterfall-series';

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

async function prepareUnzoomedWaterfall(
    data: WaterfallSeriesData[],
    options: {xAxis?: PreparedXAxis; yMin?: number; yOrder?: PreparedYAxis['order']} = {},
) {
    const {xAxis = {type: 'linear'} as PreparedXAxis, yMin = 0, yOrder} = options;
    const yAxis = {type: 'linear', min: yMin, max: 20, order: yOrder} as PreparedYAxis;
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
        boundsWidth: 300,
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

test('columns and labels follow the value direction on a reversed Y axis', async () => {
    const {shapes} = await prepareUnzoomedWaterfall(
        [
            {x: 2, y: 10, dataLabels: {enabled: true}},
            {x: 10, y: -4, dataLabels: {enabled: true}},
            {x: 100, total: true, dataLabels: {enabled: true}},
        ],
        {yOrder: 'reverse'},
    );

    expect(shapes.map(({y, height}) => [y, y + height])).toEqual([
        [0, 100],
        [60, 100],
        [0, 60],
    ]);
    expect(shapes[0].label?.y).toBeGreaterThan(100);
    expect(shapes[1].label?.y).toBeLessThan(60);
    expect(shapes[2].label?.y).toBeGreaterThan(60);
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
    });
    const originalSeries = JSON.stringify(series);
    const yScale = scaleLinear().domain([-20, 20]).range([400, 0]);
    const result = await prepareWaterfallData({
        series,
        intervals: getWaterfallIntervals(series),
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

test('places the label below a tiny negative total that has zero pixel height', async () => {
    const {shapes} = await prepareUnzoomedWaterfall(
        [
            {x: 0, y: -0.1},
            {x: 1, y: -0.2},
            {x: 2, y: 0.3},
            {x: 3, total: true, dataLabels: {enabled: true}},
            {x: 4, y: 10},
        ],
        {yMin: -20},
    );

    const total = shapes[3];
    expect(total).toMatchObject({data: {total: true}, height: 0});
    expect(total.subTotal).toBeLessThan(0);
    expect(total.label?.y).toBeGreaterThan(total.y);
});

test('keeps a zero-height label at the plot edge despite accumulated rounding', async () => {
    const data: WaterfallSeriesData[] = [
        {x: 'Opening', y: 0.1},
        {x: 'Increase', y: 0.2},
        {x: 'At limit', y: 0},
        {x: 'Decrease', y: -0.4},
        {x: 'Off plot', y: 0},
    ];
    const categories = data.map((point) => String(point.x));
    const series = prepareWaterfallSeries({
        series: [{type: 'waterfall', name: 'Balance', data}],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    const plotHeight = 240;
    const boundsWidth = 600;
    const result = await prepareWaterfallData({
        series,
        intervals: getWaterfallIntervals(series),
        seriesOptions: seriesOptionsDefaults,
        boundsWidth,
        xAxis: {type: 'category', categories} as PreparedXAxis,
        xScale: scaleBand().domain(categories).range([0, boundsWidth]),
        yAxis: [{type: 'linear'}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 0.3]).range([plotHeight, 0])],
    });

    const atLimit = result.find((column) => column.data.x === 'At limit');
    expect(atLimit).toMatchObject({y: 0, height: 0, label: {text: '0'}});
    expect(atLimit?.label?.y).toBeGreaterThan(0);
    expect(result.some((column) => column.data.x === 'Off plot')).toBe(false);
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
        boundsWidth: 100,
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

test.each(['skip', 'zero'] as const)(
    'checkpoint intervals and raw values with nullMode %s',
    (nullMode) => {
        const data: WaterfallSeriesData[] = [
            {role: 'subtotal'},
            {role: 'change', y: 100},
            {role: 'subtotal', y: null},
            {y: -130},
            {role: 'subtotal', y: 999},
            {role: 'subtotal'},
            {y: 10},
            {role: 'total'},
            {role: 'total', y: null},
            {total: true, y: null},
        ];
        const series: WaterfallSeries = {type: 'waterfall', name: 'Cash', data, nullMode};
        const points = prepareWaterfallPoints(series);
        const intervals = resolveWaterfallIntervals(points);
        const expected = [
            [0, 0],
            [0, 100],
            [0, 100],
            [100, -30],
            [0, -30],
            [0, -30],
            [-30, -20],
            [0, -20],
        ];
        if (nullMode === 'zero') expected.push([0, -20], [0, -20]);
        expect([...intervals.values()].map(({start, end}) => [start, end])).toEqual(expected);
        expect(points.filter(({role}) => role === 'subtotal').map(({y}) => y)).toEqual([
            undefined,
            null,
            999,
            undefined,
        ]);
    },
);

test('subtotal presentation inherits series settings and the resolved total color', () => {
    const [, , total, subtotal] = prepareWaterfallSeries({
        series: [
            {
                type: 'waterfall',
                name: 'Cash',
                data: [{role: 'subtotal'}],
                dataLabels: {enabled: false, format: {type: 'number', precision: 1}},
                tooltip: {enabled: false, valueFormat: {type: 'number', prefix: '$'}},
            },
        ],
        colorScale: scaleOrdinal<string, string>().range(['#135790']),
        colors: [],
        legend: {enabled: true} as PreparedLegend,
    });
    expect(subtotal).toMatchObject({
        name: 'Subtotal',
        color: '#135790',
        legend: {enabled: true, itemText: 'Subtotal'},
        dataLabels: {enabled: false, format: {type: 'number', precision: 1}},
        tooltip: {enabled: false, valueFormat: {type: 'number', prefix: '$'}},
    });
    expect(subtotal.color).toBe(total.color);
});
