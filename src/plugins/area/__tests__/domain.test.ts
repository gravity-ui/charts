import type {PreparedYAxis} from '~core/axes/types';
import {createYScale} from '~core/scales/y-scale';
import {collectYAxisDomainValues} from '~core/series/axis-domain';
import {getPreparedSeries} from '~core/series/prepareSeries';
import type {PreparedLegendOptions, PreparedSeries} from '~core/series/types';
import type {AreaSeries, ChartXAxis, ChartYAxis} from '~core/types';
import {getZoomedSeriesData} from '~core/zoom/zoom';

import {getAreaAxisData} from '../domain';

const axis = {
    type: 'linear',
    padding: {min: 0, max: 0},
    startOnTick: false,
    endOnTick: false,
    plotIndex: 0,
} as PreparedYAxis;

function prepare(seriesData: AreaSeries[]) {
    return getPreparedSeries({
        seriesData,
        colors: ['black'],
        seriesOptions: undefined,
        preparedLegend: {enabled: false} as PreparedLegendOptions,
    });
}

function sparseStack(anchor: number, sign = 1): AreaSeries[] {
    return [
        {
            type: 'area',
            name: 'A',
            stacking: 'normal',
            stackId: 'shared',
            data: [
                {x: 0, y: anchor * sign},
                {x: 5, y: 10 * sign},
                {x: 10, y: anchor * sign},
            ],
        },
        {
            type: 'area',
            name: 'B',
            stacking: 'normal',
            stackId: 'shared',
            data: [
                {x: 0, y: 100 * sign},
                {x: 10, y: 100 * sign},
            ],
        },
    ];
}

function domains(
    series: PreparedSeries[],
    range: [number, number],
    xAxis?: ChartXAxis,
    yAxis: ChartYAxis[] = [{}],
) {
    const zoomState = {x: range};
    const selection = getZoomedSeriesData({seriesData: series, zoomState, xAxis, yAxis});
    const values = collectYAxisDomainValues({
        series: selection.preparedShapesSeries,
        fallbackSeries: selection.preparedSeries.map((item, index) =>
            Array.isArray(item.data) && item.data.length === 0
                ? selection.preparedShapesSeries[index]
                : item,
        ),
        zoomState,
        xAxis,
        yAxis,
    });
    return yAxis.map((item, index) =>
        createYScale({
            axis: {...axis, ...item} as PreparedYAxis,
            boundsHeight: 300,
            series: selection.preparedShapesSeries.filter(
                (s) => ('yAxis' in s ? s.yAxis : 0) === index,
            ),
            domainValues: values?.[index],
        })
            ?.domain()
            .map(Number),
    );
}

test('fits an unstacked area to its interpolated boundaries under X zoom', async () => {
    const series = await prepare([
        {
            type: 'area',
            name: 'Area',
            data: [
                {x: 0, y: 0},
                {x: 5, y: 10},
                {x: 6, y: 12},
                {x: 10, y: 100},
            ],
        },
    ]);
    const [domain] = domains(series, [4, 9]);
    expect(domain).toEqual([0, 78]);
});

test.each([
    ['skip', 12],
    ['connect', 78],
    ['zero', 50],
] as const)('clips an unstacked area with nullMode=%s', async (nullMode, max) => {
    const series = await prepare([
        {
            type: 'area',
            name: 'Area',
            nullMode,
            data: [
                {x: 0, y: 0},
                {x: 5, y: 10},
                {x: 6, y: 12},
                {x: 8, y: null},
                {x: 10, y: 100},
            ],
        },
    ]);
    const [domain] = domains(series, [4, 9]);
    expect(domain).toEqual([0, max]);
});

test.each([
    {anchor: 1000, sign: 1, min: 0, max: 228},
    {anchor: 10, sign: 1, min: 0, max: 30},
    {anchor: 1000, sign: -1, min: -228, max: 0},
])(
    'fits the visible sparse stack rather than per-series anchors: $anchor, $sign',
    async ({anchor, sign, min, max}) => {
        const source = sparseStack(anchor, sign);
        const before = JSON.stringify(source);
        const series = await prepare(source);
        const [domain] = domains(series, [4, 6]);
        expect(domain?.[0]).toBeCloseTo(min);
        expect(domain?.[1]).toBeCloseTo(max);
        expect(JSON.stringify(source)).toBe(before);
    },
);

test('accumulates positive and negative boundaries separately on a sparse X grid', async () => {
    const source = sparseStack(100);
    source[1].data = [
        {x: 0, y: -200},
        {x: 10, y: -200},
    ];
    const [domain] = domains(await prepare(source), [4, 6]);
    expect(domain?.[0]).toBeCloseTo(-40);
    expect(domain?.[1]).toBeCloseTo(28);
});

test('does not lift another layer with a point isolated between explicit nulls', async () => {
    const source = sparseStack(10);
    source[1].data = [
        {x: 0, y: null},
        {x: 5, y: 1000},
        {x: 10, y: null},
    ];
    const [domain] = domains(await prepare(source), [4, 6]);
    expect(domain).toEqual([0, 1000]);
});

test('uses the last duplicate X sample before constructing stack boundaries', async () => {
    const source = sparseStack(1000);
    source[0].data.splice(1, 0, {x: 5, y: 1e6});
    const [domain] = domains(await prepare(source), [4, 6]);
    expect(domain?.[1]).toBeCloseTo(228);
});

test('clips cumulative values in logarithmic X coordinates', async () => {
    const source = sparseStack(1000);
    source[0].data.forEach((point, index) => {
        point.x = [1, 10, 100][index];
    });
    source[1].data.forEach((point, index) => {
        point.x = [1, 100][index];
    });
    const [domain] = domains(await prepare(source), [Math.sqrt(10), Math.sqrt(1000)], {
        type: 'logarithmic',
    });
    expect(domain?.[1]).toBeCloseTo(555);
});

test('interpolates cumulative boundaries after logarithmic Y projection', async () => {
    const source = sparseStack(10);
    source[0].data = [
        {x: 0, y: 90},
        {x: 10, y: 9000},
    ];
    source[1].data = [
        {x: 0, y: 10},
        {x: 10, y: 1000},
    ];
    const [domain] = domains(await prepare(source), [2.5, 7.5], undefined, [{type: 'logarithmic'}]);
    expect(domain?.[0]).toBeCloseTo(Math.sqrt(10));
    expect(domain?.[1]).toBeCloseTo(1000 * Math.sqrt(10));
});

test.each([
    {range: [5, 5], expected: [0, 10]},
    {range: [-5, 15], expected: [0, 1100]},
    {range: [11, 12], expected: []},
    {range: [6, 4], expected: []},
] satisfies {range: [number, number]; expected: number[]}[])(
    'clips point, oversized and empty windows without falling back to distant anchors: $range',
    ({range, expected}) => {
        const {domainValues} = getAreaAxisData({
            series: sparseStack(1000),
            axis: 'y',
            viewport: {x: {type: 'linear', range}, y: {type: 'linear'}},
        });
        const values = domainValues.map(Number);
        expect(values.length ? [Math.min(...values), Math.max(...values)] : []).toEqual(expected);
    },
);

test('refreshes clipped domains across repeated windows and visibility changes on separate axes', async () => {
    const source = sparseStack(1000);
    source.push({
        type: 'area',
        name: 'Other axis',
        stacking: 'normal',
        stackId: 'shared',
        yAxis: 1,
        data: [
            {x: 0, y: 5},
            {x: 10, y: 5},
        ],
    });
    const series = await prepare(source);
    const axes = [{}, {plotIndex: 1}];
    expect(domains(series, [4, 6], undefined, axes)?.[1]).toEqual([0, 5]);
    expect(domains(series, [4.5, 5.5], undefined, axes)?.[0]?.[1]).toBeCloseTo(119);
    series[1].visible = false;
    expect(domains(series, [4, 6], undefined, axes)?.[0]?.[1]).toBeCloseTo(208);
    series[0].visible = false;
    expect(domains(series, [4, 6], undefined, axes)?.[0]?.[1]).toBeCloseTo(228);
});
