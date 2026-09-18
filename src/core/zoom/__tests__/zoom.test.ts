import type {PreparedSeries} from '../../series';
import type {AreaRangeSeriesData, ChartXAxis, ChartYAxis} from '../../types';
import {getZoomedSeriesData} from '../zoom';

// Minimal series factories. Real `PreparedSeries` carries many extra fields,
// but `getZoomedSeriesData` only inspects `type`, `data`, `stacking`,
// `valueAxis`, `yAxis`, so casting these stubs to `any` is safe for the test.

function barX(opts: {data: {x: string | number; y: number}[]; stacking?: 'normal' | 'percent'}) {
    return {
        type: 'bar-x',
        data: opts.data,
        valueAxis: 'y',
        ...(opts.stacking ? {stacking: opts.stacking} : {}),
    };
}

function barY(opts: {data: {x: number; y: string | number}[]; stacking?: 'normal' | 'percent'}) {
    return {
        type: 'bar-y',
        data: opts.data,
        valueAxis: 'x',
        ...(opts.stacking ? {stacking: opts.stacking} : {}),
    };
}

function area(opts: {data: {x: number; y: number}[]; stacking?: 'normal' | 'percent'}) {
    return {
        type: 'area',
        data: opts.data,
        valueAxis: 'y',
        ...(opts.stacking ? {stacking: opts.stacking} : {}),
    };
}

function areaRange(data: AreaRangeSeriesData[]) {
    return {type: 'area-range', data};
}

function categoryXAxis(categories: string[]): ChartXAxis {
    return {type: 'category', categories} as ChartXAxis;
}

function linearXAxis(): ChartXAxis {
    return {type: 'linear'} as ChartXAxis;
}

function linearYAxis(): ChartYAxis {
    return {type: 'linear'} as ChartYAxis;
}

function categoryYAxis(categories: string[]): ChartYAxis {
    return {type: 'category', categories} as ChartYAxis;
}

describe('zoom/getZoomedSeriesData', () => {
    test('returns input unchanged when zoomState is empty', () => {
        const series = [barX({data: [{x: 'A', y: 1}]})];
        const result = getZoomedSeriesData({
            seriesData: series as unknown as PreparedSeries[],
            zoomState: {},
        });
        expect(result.preparedSeries).toBe(series);
    });

    test('preserves adjacent area-range points for x filtering', () => {
        const series = [
            areaRange([
                {x: 0, y0: 1, y1: 5},
                {x: 1, y0: 2, y1: 6},
                {x: 2, y0: 3, y1: 7},
                {x: 3, y0: 4, y1: 8},
            ]),
        ];
        const result = getZoomedSeriesData({
            seriesData: series as unknown as PreparedSeries[],
            xAxis: linearXAxis(),
            zoomState: {x: [1, 2]},
        });

        expect(result.preparedSeries[0].data).toEqual([
            {x: 1, y0: 2, y1: 6},
            {x: 2, y0: 3, y1: 7},
        ]);
        expect(result.preparedShapesSeries[0].data).toEqual(series[0].data);
    });

    test.each(['line', 'area', 'area-range'] as const)(
        '%s keeps adjacent shape points on a continuous X axis',
        (type) => {
            const data = [0, 1, 2, 3].map((x) => ({x, y: 5, y0: 1, y1: 5}));
            const result = getZoomedSeriesData({
                seriesData: [{type, data}] as unknown as PreparedSeries[],
                xAxis: linearXAxis(),
                zoomState: {x: [0.5, 2.5]},
            });
            expect(result.preparedSeries[0].data).toEqual(data.slice(1, 3));
            expect(result.preparedShapesSeries[0].data).toEqual(data);
        },
    );

    test.each(['line', 'area', 'area-range'] as const)(
        '%s does not preserve neighbors on a category X axis',
        (type) => {
            const data = ['A', 'B', 'C', 'D'].map((x) => ({x, y: 5, y0: 1, y1: 5}));
            const result = getZoomedSeriesData({
                seriesData: [{type, data}] as unknown as PreparedSeries[],
                xAxis: categoryXAxis(['D', 'C', 'B', 'A']),
                zoomState: {x: [1, 2]},
            });
            expect(result.preparedSeries[0].data).toEqual(data.slice(1, 3));
            expect(result.preparedShapesSeries[0].data).toEqual(data.slice(1, 3));
        },
    );

    test.each([undefined, 'line', 'scatter'] as const)(
        'Y/XY zoom keeps overlapping intervals next to %s',
        (companion) => {
            const data: AreaRangeSeriesData[] = [
                {x: 0, y0: -20, y1: -10},
                {x: 1, y0: 0, y1: 100},
                {x: 2, y0: 10, y1: 25},
                {x: 3, y0: 25, y1: 35},
                {x: 4, y0: 40, y1: 50},
                {x: 5, y0: null, y1: 30},
            ];
            const series = [
                areaRange(data),
                ...(companion ? [{type: companion, data: [{x: 2, y: 25}]}] : []),
            ];
            for (const x of [undefined, [0.5, 2.5] as [number, number]]) {
                const result = getZoomedSeriesData({
                    seriesData: series as PreparedSeries[],
                    xAxis: linearXAxis(),
                    yAxis: [linearYAxis()],
                    zoomState: {...(x ? {x} : {}), y: [[20, 30]]},
                });
                expect(result.preparedSeries[0].data).toEqual(data.slice(1, x ? 3 : 4));
                expect(result.preparedShapesSeries[0].data).toEqual(data.slice(0, x ? 4 : 5));
                if (companion) {
                    expect(result.preparedSeries[1].data).toEqual([{x: 2, y: 25}]);
                }
            }
        },
    );

    test('area-range uses its own Y axis and includes intervals touching the edges', () => {
        const data = [
            {x: 0, y0: 0, y1: 20},
            {x: 1, y0: 30, y1: 40},
            {x: 2, y0: 40, y1: 50},
            {x: 3, y0: 10, y1: null},
        ];
        const result = getZoomedSeriesData({
            seriesData: [{...areaRange(data), yAxis: 1}] as PreparedSeries[],
            yAxis: [linearYAxis(), linearYAxis()],
            zoomState: {
                y: [
                    [500, 600],
                    [20, 30],
                ],
            },
        });
        expect(result.preparedSeries[0].data).toEqual(data.slice(0, 2));
    });

    describe('stacked bar-x + xy zoom', () => {
        // bar-x: x is category (filterable), y is value (cumulative when stacked)
        const categories = ['A', 'B', 'C', 'D'];
        const xAxis = categoryXAxis(categories);
        const yAxis = [linearYAxis()];

        test('skips Y filter — small y values stay so the stack remains intact', () => {
            const series = [
                barX({stacking: 'normal', data: [{x: 'B', y: 1}]}),
                barX({stacking: 'normal', data: [{x: 'B', y: 100}]}),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [1, 2], y: [[50, 200]]},
            });
            // Without the fix the y=1 segment would be dropped (1 ∉ [50, 200])
            // and the stack at "B" would render with only the y=100 piece.
            expect(result.preparedSeries[0].data).toEqual([{x: 'B', y: 1}]);
            expect(result.preparedSeries[1].data).toEqual([{x: 'B', y: 100}]);
        });

        test('still applies X filter — categories outside the zoom range are dropped', () => {
            const series = [
                barX({
                    stacking: 'normal',
                    data: [
                        {x: 'A', y: 5},
                        {x: 'B', y: 5},
                        {x: 'D', y: 5},
                    ],
                }),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [1, 2], y: [[0, 100]]},
            });
            expect(result.preparedSeries[0].data).toEqual([{x: 'B', y: 5}]);
        });

        test('non-stacked bar-x still drops points whose y is outside the zoom range', () => {
            const series = [
                barX({
                    data: [
                        {x: 'B', y: 1},
                        {x: 'B', y: 100},
                    ],
                }),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [1, 2], y: [[50, 200]]},
            });
            expect(result.preparedSeries[0].data).toEqual([{x: 'B', y: 100}]);
        });
    });

    describe('stacked bar-y + xy zoom', () => {
        // bar-y: x is value (cumulative when stacked), y is category
        const categories = ['2007', '2008', '2009'];
        const xAxis = linearXAxis();
        const yAxis = [categoryYAxis(categories)];

        test('skips X filter — small x contributions stay so the stack remains intact', () => {
            const series = [
                barY({stacking: 'normal', data: [{x: 1, y: '2007'}]}),
                barY({stacking: 'normal', data: [{x: 80, y: '2007'}]}),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [78, 92], y: [[0, 0]]},
            });
            // Both segments must survive — without the fix x=1 (or x=80, since
            // 80 ∈ [78, 92] but 1 ∉) would be filtered and the cumulative
            // stack would re-anchor from 0 instead of from the previous sum.
            expect(result.preparedSeries[0].data).toEqual([{x: 1, y: '2007'}]);
            expect(result.preparedSeries[1].data).toEqual([{x: 80, y: '2007'}]);
        });

        test('still applies Y filter — categories outside the zoom range are dropped', () => {
            const series = [
                barY({
                    stacking: 'normal',
                    data: [
                        {x: 50, y: '2007'},
                        {x: 50, y: '2008'},
                        {x: 50, y: '2009'},
                    ],
                }),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [0, 100], y: [[0, 1]]},
            });
            expect(result.preparedSeries[0].data).toEqual([
                {x: 50, y: '2007'},
                {x: 50, y: '2008'},
            ]);
        });

        test('non-stacked bar-y still drops points whose x is outside the zoom range', () => {
            const series = [
                barY({
                    data: [
                        {x: 1, y: '2007'},
                        {x: 80, y: '2007'},
                    ],
                }),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis,
                yAxis,
                zoomState: {x: [78, 92], y: [[0, 0]]},
            });
            expect(result.preparedSeries[0].data).toEqual([{x: 80, y: '2007'}]);
        });
    });

    describe('stacked area + y zoom', () => {
        test('skips Y filter — small y values stay so the cumulative stack stays intact', () => {
            const series = [
                area({
                    stacking: 'normal',
                    data: [
                        {x: 1, y: 1},
                        {x: 2, y: 100},
                    ],
                }),
            ];
            const result = getZoomedSeriesData({
                seriesData: series as unknown as PreparedSeries[],
                xAxis: linearXAxis(),
                yAxis: [linearYAxis()],
                zoomState: {y: [[50, 200]]},
            });
            expect(result.preparedSeries[0].data).toEqual([
                {x: 1, y: 1},
                {x: 2, y: 100},
            ]);
        });
    });
});
