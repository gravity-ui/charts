import type {AreaSeries, BarXSeries, BarYSeries} from '../../../types';
import {getDomainDataXBySeries, getDomainDataYBySeries} from '../common';

describe.each(['bar-x', 'bar-y', 'area'] as const)('%s duplicate category domain', (type) => {
    test.each([
        {values: [-100, -75], expected: [-100]},
        {values: [100, 75], expected: [100]},
        {values: [-100, 75, -50, 25], expected: [-100, 75]},
        {values: [0, 0], expected: [0]},
        {values: [-100, 0], expected: [-100, 0]},
    ])('retains both sign extremes for $values', ({values, expected}) => {
        const series = [
            {
                type,
                data: values.map((value) =>
                    type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value},
                ),
            },
        ] as (AreaSeries | BarXSeries | BarYSeries)[];
        const domain =
            type === 'bar-y' ? getDomainDataXBySeries(series) : getDomainDataYBySeries(series);
        expect(domain).toEqual(expected);
    });

    test('accumulates each sign separately across a stack', () => {
        const series = [
            [-100, -75, 20],
            [-30, 40, 10],
        ].map((values) => ({
            type,
            stacking: 'normal',
            stackId: 'shared',
            data: values.map((value) => (type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value})),
        })) as (AreaSeries | BarXSeries | BarYSeries)[];
        expect(
            type === 'bar-y' ? getDomainDataXBySeries(series) : getDomainDataYBySeries(series),
        ).toEqual([-130, 60]);
    });
});
