import type {PreparedSeries} from '../../series';
import type {ChartXAxis, ChartYAxis} from '../../types';
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
