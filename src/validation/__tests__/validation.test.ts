import {validateData} from '../';
import type {GravityChartError} from '../../libs';
import {GRAVITY_CHART_ERROR_CODE} from '../../libs';
import type {ChartKitWidgetData} from '../../types';
import {PIE_SERIES, XY_SERIES} from '../__mocks__';

describe('plugins/d3/validation', () => {
    test.each<any>([undefined, null, {}, {series: {}}, {series: {data: []}}])(
        'validateData should throw an error in case of empty data (data: %j)',
        (data) => {
            let error: GravityChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as GravityChartError;
            }

            expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.NO_DATA);
        },
    );

    test.each<any>([
        {series: {data: [{data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'invalid-type', data: [{x: 1, y: 1}]}]}},
    ])('validateData should throw an error in case of incorrect series type (data: %j)', (data) => {
        let error: GravityChartError | null = null;

        try {
            validateData(data);
        } catch (e) {
            error = e as GravityChartError;
        }

        expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
    });

    test.each<ChartKitWidgetData>([
        XY_SERIES.INVALID_CATEGORY_X,
        XY_SERIES.INVALID_CATEGORY_Y,
        XY_SERIES.INVALID_DATETIME_X,
        XY_SERIES.INVALID_DATETIME_Y,
        XY_SERIES.INVALID_LINEAR_X,
        XY_SERIES.INVALID_LINEAR_Y,
    ])(
        '[XY Series] validateData should throw an error in case of invalid data (data: %j)',
        (data) => {
            let error: GravityChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as GravityChartError;
            }

            expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each<ChartKitWidgetData>([PIE_SERIES.INVALID_VALUE])(
        '[Pie Series] validateData should throw an error in case of invalid data (data: %j)',
        (data) => {
            let error: GravityChartError | null = null;

            try {
                validateData(data);
            } catch (e) {
                error = e as GravityChartError;
            }

            expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each([
        {series: {data: [{type: 'area', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'bar-x', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
        {series: {data: [{type: 'bar-y', stacking: 'notNormal', data: [{x: 1, y: 1}]}]}},
    ])(
        'validateData should throw an error in case of invalid stacking value (data: %j)',
        (data) => {
            let error: GravityChartError | null = null;

            try {
                validateData(data as ChartKitWidgetData);
            } catch (e) {
                error = e as GravityChartError;
            }

            expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
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
            let error: GravityChartError | null = null;

            try {
                validateData({
                    series: {
                        data: [
                            {
                                type: 'treemap',
                                data,
                            },
                        ] as ChartKitWidgetData['series']['data'],
                    },
                });
            } catch (e) {
                error = e as GravityChartError;
            }

            expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test('validateData should throw an error in case of invalid axis index', () => {
        const data = {series: {data: [{type: 'line', yAxis: 5, data: [{x: 1, y: 1}]}]}};
        let error: GravityChartError | null = null;

        try {
            validateData(data as ChartKitWidgetData);
        } catch (e) {
            error = e as GravityChartError;
        }

        expect(error?.code).toEqual(GRAVITY_CHART_ERROR_CODE.INVALID_DATA);
    });
});
