import {validateData} from '../';
import type {ChartError} from '../../../libs';
import {CHART_ERROR_CODE} from '../../../libs';
import type {ChartData} from '../../types';
import {PIE_SERIES, XY_SERIES} from '../__mocks__';

function getValidGradient() {
    return {
        type: 'linear-gradient' as const,
        stops: [
            {offset: 0, color: '#fff'},
            {offset: 1, color: '#000'},
        ],
    };
}

describe('validation/validateData', () => {
    test.each<any>([undefined, null, {}, {series: {}}, {series: {data: []}}])(
        'validateData should throw an error in case of empty data (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.NO_DATA);
        },
    );

    test.each<any>([
        {series: {data: [{data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'invalid-type', data: [{x: 1, y: 1}]}]}},
    ])('validateData should throw an error in case of incorrect series type (data: %j)', (data) => {
        let error: ChartError | null = null;

        try {
            validateData(data);
        } catch (e) {
            error = e as ChartError;
        }

        expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
    });

    test.each<ChartData>([
        XY_SERIES.INVALID_CATEGORY_X,
        XY_SERIES.INVALID_CATEGORY_Y,
        XY_SERIES.INVALID_DATETIME_X,
        XY_SERIES.INVALID_DATETIME_Y,
        XY_SERIES.INVALID_LINEAR_X,
        XY_SERIES.INVALID_LINEAR_Y,
    ])(
        '[XY Series] validateData should throw an error in case of invalid data (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each<ChartData>([PIE_SERIES.INVALID_VALUE])(
        '[Pie Series] validateData should throw an error in case of invalid data (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each([
        null,
        42,
        [],
        {...getValidGradient(), type: 'radial-gradient'},
        {...getValidGradient(), stops: []},
        {...getValidGradient(), stops: [null, {offset: 1, color: '#000'}]},
        {
            ...getValidGradient(),
            stops: [
                {offset: '0', color: '#fff'},
                {offset: 1, color: '#000'},
            ],
        },
        {
            ...getValidGradient(),
            stops: [
                {offset: 0, color: ''},
                {offset: 1, color: '#000'},
            ],
        },
        {
            ...getValidGradient(),
            stops: [
                {offset: 0, color: 'var(--series-color)'},
                {offset: 1, color: '#000'},
            ],
        },
        {
            ...getValidGradient(),
            stops: [
                {offset: 0.75, color: '#fff'},
                {offset: 0.25, color: '#000'},
            ],
        },
        {...getValidGradient(), angle: Number.POSITIVE_INFINITY},
    ])('validateData should reject an invalid series color (%j)', (color) => {
        const data = {
            series: {
                data: [{type: 'line', color, name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        } as unknown as ChartData;

        expect(() => validateData(data)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });

    test('validateData should preserve the palette fallback for an empty series color', () => {
        const data: ChartData = {
            series: {
                data: [{type: 'line', color: '', name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        };

        expect(() => validateData(data)).not.toThrow();
    });

    test('validateData should reject an invalid area fill color', () => {
        const data = {
            series: {
                data: [
                    {
                        type: 'area',
                        name: 'Series 1',
                        fillColor: {...getValidGradient(), stops: [{offset: 0, color: '#fff'}]},
                        data: [{x: 1, y: 1}],
                    },
                ],
            },
        } as unknown as ChartData;

        expect(() => validateData(data)).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });

    test.each([
        {
            series: {
                data: [
                    {
                        type: 'area',
                        stacking: 'normal',
                        nullMode: 'connect',
                        data: [{x: 1, y: 1}],
                    },
                ],
            },
        },
        {
            series: {
                data: [
                    {
                        type: 'area',
                        stacking: 'percent',
                        nullMode: 'connect',
                        data: [{x: 1, y: 1}],
                    },
                ],
            },
        },
    ])(
        'validateData should throw an error when stacking area series use nullMode=connect (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data as ChartData);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each([
        {series: {data: [{type: 'area', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'bar-x', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'bar-y', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
    ])(
        'validateData should throw an error in case of invalid stacking value (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data as ChartData);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each([
        null,
        {type: 'invalid'},
        {type: 'cardinal', tension: Number.NaN},
        {type: 'cardinal', tension: -0.1},
        {type: 'cardinal', tension: 1.1},
    ])(
        'validateData should reject invalid line interpolation (interpolation: %j)',
        (interpolation) => {
            const data = {
                series: {
                    data: [{type: 'line', name: 'Series 1', interpolation, data: [{x: 1, y: 1}]}],
                },
            } as unknown as ChartData;

            expect(() => validateData(data)).toThrow(
                expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
            );
        },
    );

    test.each([
        {type: 'linear'},
        {type: 'monotone'},
        {type: 'cardinal'},
        {type: 'cardinal', tension: 0},
        {type: 'cardinal', tension: 1},
    ])(
        'validateData should accept valid line interpolation (interpolation: %j)',
        (interpolation) => {
            const data = {
                series: {
                    data: [{type: 'line', name: 'Series 1', interpolation, data: [{x: 1, y: 1}]}],
                },
            } as ChartData;

            expect(() => validateData(data)).not.toThrow();
        },
    );

    test.each([
        [[{name: '1'} /* error */]],
        [[{name: '1'}, {name: '2', parentId: '1'} /* error */]],
        [
            [
                {name: '1', value: 1}, // error
                {name: '2', parentId: '1', value: 1},
            ],
        ],
        [
            [
                {name: '1'},
                {name: '2', parentId: '1', value: 1}, // error
                {name: '3', parentId: '2', value: 1},
                {name: '4', parentId: '2', value: 1},
            ],
        ],
    ])(
        '[Treemap Series] validateData should throw an error in case of invalid data (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData({
                    series: {
                        data: [
                            {
                                type: 'treemap',
                                data,
                            },
                        ] as ChartData['series']['data'],
                    },
                });
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test('validateData should throw an error in case of invalid axis index', () => {
        const data = {series: {data: [{type: 'line', yAxis: 5, data: [{x: 1, y: 1}]}]}};
        let error: ChartError | null = null;

        try {
            validateData(data as ChartData);
        } catch (e) {
            error = e as ChartError;
        }

        expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
    });

    test.each([
        {
            series: {data: [{type: 'line', data: [{x: 1, y: 1}]}]},
            tooltip: {totals: {aggregation: 'unknown'}},
        },
        {
            series: {data: [{type: 'line', data: [{x: 1, y: 1}]}]},
            tooltip: {totals: {aggregation: 42}},
        },
    ])(
        'validateData should throw an error in case of invalid tooltip.totals.aggregation (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateData(data as unknown as ChartData);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    describe('Null value support', () => {
        test.each<ChartData>([
            {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: null},
                                {x: 2, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                xAxis: {type: 'datetime'},
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1234567890, y: null},
                                {x: 1234567900, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                series: {
                    data: [
                        {
                            type: 'area',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: null},
                                {x: 2, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: null},
                                {x: 2, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                yAxis: [{categories: ['A', 'B'], type: 'category'}],
                series: {
                    data: [
                        {
                            type: 'bar-y',
                            name: 'Series 1',
                            data: [
                                {y: 'A', x: null},
                                {y: 'B', x: 3},
                            ],
                        },
                    ],
                },
            },
            {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: null},
                                {x: null, y: 3},
                            ],
                        },
                    ],
                },
            },
        ])('[XY Series] validateData should accept null values for x and y (data: %j)', (data) => {
            expect(() => validateData(data)).not.toThrow();
        });

        test.each([
            {
                xAxis: {type: 'datetime'},
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: null, y: 100},
                                {x: 1234567900, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                xAxis: {type: 'datetime'},
                yAxis: [{type: 'datetime'}],
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1234567890, y: null},
                                {x: 1234567900, y: 3},
                            ],
                        },
                    ],
                },
            },
            {
                xAxis: {type: 'datetime'},
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series 1',
                            data: [
                                {x: null, y: 100},
                                {x: 1234567900, y: 3},
                            ],
                        },
                    ],
                },
            },
        ])(
            '[Datetime Axis] validateData should throw error for nullable values (data: %j)',
            (data) => {
                let error: ChartError | null = null;

                try {
                    validateData(data as ChartData);
                } catch (e) {
                    error = e as ChartError;
                }
                expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
            },
        );
    });
});
