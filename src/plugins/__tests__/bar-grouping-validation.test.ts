import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {BarXSeries, BarYSeries, ChartData} from '../../types';

describe.each(['bar-x', 'bar-y'] as const)('%s stack grouping validation', (type) => {
    function config(
        grouping: (boolean | undefined)[],
        stacking: BarXSeries['stacking'] = 'normal',
    ) {
        const series: (BarXSeries | BarYSeries)[] = grouping.map((value, index) => ({
            type,
            name: `Series ${index + 1}`,
            stackId: 'shared',
            stacking,
            grouping: value,
            data: [type === 'bar-x' ? {x: 1, y: 20} : {x: 20, y: 1}],
        }));
        const data: ChartData = {series: {data: series}};
        return {series, data};
    }

    const error = expect.objectContaining({
        code: CHART_ERROR_CODE.INVALID_DATA,
        message: expect.stringContaining('grouping'),
    });

    test.each([
        {grouping: [true, false], stacking: 'normal' as const},
        {grouping: [undefined, false], stacking: 'normal' as const},
        {grouping: [false, undefined], stacking: 'percent' as const},
    ])('rejects mixed grouping: %j', ({grouping, stacking}) => {
        const {data} = config(grouping, stacking);
        expect(() => validateData(data)).toThrow(error);
    });

    test('validates the implicit stack, including an empty stackId', () => {
        const {series, data} = config([true, false]);
        series[0].stackId = undefined;
        series[1].stackId = '';
        expect(() => validateData(data)).toThrow(error);
    });

    test('includes initially hidden stack members', () => {
        const {series, data} = config([true, false]);
        series[1].visible = false;
        expect(() => validateData(data)).toThrow(error);
    });

    test.each(['normal', 'percent'] as const)(
        'accepts consistent grouping in %s stacks',
        (stacking) => {
            for (const grouping of [
                [undefined, true],
                [false, false],
            ]) {
                const {data} = config(grouping, stacking);
                expect(() => validateData(data)).not.toThrow();
            }
        },
    );

    test('allows different grouping in distinct stacks', () => {
        const {series, data} = config([true, false]);
        series[1].stackId = 'other';
        expect(() => validateData(data)).not.toThrow();
    });

    test('allows independent non-stacked overlays sharing a stackId', () => {
        const {series, data} = config([true, false]);
        series[1].stacking = undefined;
        expect(() => validateData(data)).not.toThrow();
        series[0].stacking = undefined;
        expect(() => validateData(data)).not.toThrow();
    });

    test('includes grouped non-stacked bars that share an explicit stackId', () => {
        const {series, data} = config([true, false]);
        series[0].stacking = undefined;
        expect(() => validateData(data)).toThrow(error);
    });
});

test('bar-x grouping is scoped to the value axis, with omitted yAxis meaning zero', () => {
    const series: BarXSeries[] = [true, false].map((grouping, index) => ({
        type: 'bar-x',
        name: String(index),
        stackId: 'shared',
        stacking: 'normal',
        grouping,
        data: [{x: 1, y: 20}],
    }));
    const data: ChartData = {
        series: {data: series},
        yAxis: [{position: 'left'}, {position: 'right'}],
    };
    series[1].yAxis = 1;
    expect(() => validateData(data)).not.toThrow();
    series[1].yAxis = 0;
    expect(() => validateData(data)).toThrow(
        expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
    );
});

test('different bar types do not share grouping constraints', () => {
    const data: ChartData = {
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Vertical',
                    stackId: 'shared',
                    stacking: 'normal',
                    grouping: true,
                    data: [{x: 1, y: 20}],
                },
                {
                    type: 'bar-y',
                    name: 'Horizontal',
                    stackId: 'shared',
                    stacking: 'normal',
                    grouping: false,
                    data: [{x: 20, y: 1}],
                },
            ],
        },
    };
    expect(() => validateData(data)).not.toThrow();
});
