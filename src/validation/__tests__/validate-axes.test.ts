import type {ChartError} from '../../libs';
import {CHART_ERROR_CODE} from '../../libs';
import {validateAxes} from '../validate-axes';

type Args = Parameters<typeof validateAxes>[0];

describe('validation/validateAxes', () => {
    test.each([{xAxis: {type: 'unknown'}}, {yAxis: [{type: 'unknown'}]}])(
        'validateAxes should throw an error in case of invalid axis type (data: %j)',
        (data) => {
            let error: ChartError | null = null;

            try {
                validateAxes(data as Args);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each([1, '1', {}, null])(
        'validateAxes should throw an error in case of invalid labels.html type (data: %j)',
        (html) => {
            let xAxisError: ChartError | null = null;
            let yAxisError: ChartError | null = null;

            try {
                validateAxes({xAxis: {labels: {html: html as boolean}}});
            } catch (e) {
                xAxisError = e as ChartError;
            }

            try {
                validateAxes({yAxis: [{labels: {html: html as boolean}}]});
            } catch (e) {
                yAxisError = e as ChartError;
            }

            expect(xAxisError?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
            expect(yAxisError?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each<Args>([
        {xAxis: {labels: {html: true}, type: 'linear'}},
        {yAxis: [{labels: {html: true}, type: 'linear'}]},
    ])(
        'validateAxes should throw an error in case of using html labels with non-category axis type (data: %j)',
        (args) => {
            let error: ChartError | null = null;

            try {
                validateAxes(args);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
        },
    );

    test.each<Args>([
        {
            xAxis: {
                type: 'category',
                categories: ['a', 'b', 'a'],
            },
        },
        {
            yAxis: [
                {
                    type: 'category',
                    categories: ['x', 'y', 'x'],
                },
            ],
        },
        {
            xAxis: {
                type: 'category',
                categories: ['a', 'b', 'c'],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['a', 'b', 'c'],
                },
                {
                    type: 'category',
                    categories: ['x', 'y', 'x'],
                },
            ],
        },
    ])('validateAxes should throw an error in case of duplicate categories (data: %j)', (args) => {
        let error: ChartError | null = null;

        try {
            validateAxes(args);
        } catch (e) {
            error = e as ChartError;
        }

        expect(error?.code).toEqual(CHART_ERROR_CODE.INVALID_DATA);
    });

    test.each<Args>([
        {
            xAxis: {
                type: 'category',
                categories: ['a', 'b', 'c'],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['x', 'y', 'z'],
                },
            ],
        },
        {
            xAxis: {
                type: 'linear',
            },
            yAxis: [
                {
                    type: 'datetime',
                },
            ],
        },
    ])(
        'validateAxes should not throw an error when categories are unique or axis is not category type (data: %j)',
        (args) => {
            let error: ChartError | null = null;

            try {
                validateAxes(args);
            } catch (e) {
                error = e as ChartError;
            }

            expect(error).toBeNull();
        },
    );
});
