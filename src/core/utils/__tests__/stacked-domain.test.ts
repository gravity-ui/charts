import type {AreaSeries, BarXSeries, BarYSeries} from '../../../types';
import {getDomainDataXBySeries, getDomainDataYBySeries} from '../common';

describe.each(['bar-x', 'bar-y'] as const)('%s duplicate category domain', (type) => {
    test.each([
        {values: [-100, -75], expected: [-175]},
        {values: [100, 75], expected: [175]},
        {values: [-100, 75, -50, 25], expected: [-150, 100]},
    ])('includes every rendered segment for $values', ({values, expected}) => {
        const series: (BarXSeries | BarYSeries)[] = [
            {
                type,
                name: 'Bars',
                data: values.map((value) =>
                    type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value},
                ),
            },
        ];
        const domain =
            type === 'bar-y' ? getDomainDataXBySeries(series) : getDomainDataYBySeries(series);
        expect(domain).toEqual(expected);
    });

    test.each([
        {values: [100, 75], expected: [100]},
        {values: [undefined, null, 75, 100], expected: [100]},
        {values: [-100, -75], expected: [-100]},
        {values: [-100, 75, -50, 25, null], expected: [-100, 75]},
    ])('uses independent overlay extrema for $values', ({values, expected}) => {
        const series = {
            type,
            name: 'Overlay',
            grouping: false,
            data: values.map((value) =>
                type === 'bar-y' ? {x: value, y: 'A'} : {x: 'A', y: value},
            ),
        } as BarXSeries | BarYSeries;
        const original = JSON.stringify(series);
        expect(
            type === 'bar-y' ? getDomainDataXBySeries([series]) : getDomainDataYBySeries([series]),
        ).toEqual(expected);
        expect(JSON.stringify(series)).toBe(original);
    });

    test.each([true, false])('accumulates each sign across a stack, grouping=%s', (grouping) => {
        const series: (BarXSeries | BarYSeries)[] = [
            [-100, -75, 20],
            [-30, 40, 10],
        ].map((values) => ({
            type,
            name: 'Bars',
            stacking: 'normal',
            grouping,
            stackId: 'shared',
            data: values.map((value) => (type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value})),
        }));
        expect(
            type === 'bar-y' ? getDomainDataXBySeries(series) : getDomainDataYBySeries(series),
        ).toEqual([-205, 70]);
    });
});

describe('area duplicate category domain', () => {
    test.each([
        {values: [-100, -75], expected: [-75]},
        {values: [100, 75], expected: [75]},
        {values: [-100, null], expected: [0]},
    ])('uses the last point for $values', ({values, expected}) => {
        const series: AreaSeries[] = [
            {type: 'area', name: 'Area', data: values.map((y) => ({x: 1, y}))},
        ];
        expect(getDomainDataYBySeries(series)).toEqual(expected);
    });

    test('stacks only the last point of each series at each X', () => {
        const series: AreaSeries[] = [
            [-100, -75, 20],
            [-30, 40, 10],
        ].map((values) => ({
            type: 'area',
            name: 'Area',
            stacking: 'normal',
            stackId: 'shared',
            data: values.map((y) => ({x: 1, y})),
        }));
        expect(getDomainDataYBySeries(series)).toEqual([30]);
    });
});
