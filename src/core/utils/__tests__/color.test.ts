import type {ChartData} from '../../../types';
import {getDomainForContinuousColorScale} from '../color';

type Series = ChartData['series']['data'];

describe('getDomainForContinuousColorScale', () => {
    // One case per supported type guards each plugin's field mapping individually,
    // so a regression in a single type (e.g. a swapped field) is caught.
    test.each<{type: string; data: unknown[]; expected: number[]}>([
        {
            type: 'line',
            data: [
                {x: 0, y: 1},
                {x: 1, y: 5},
            ],
            expected: [1, 5],
        },
        {
            type: 'area',
            data: [
                {x: 0, y: 1},
                {x: 1, y: 5},
            ],
            expected: [1, 5],
        },
        {
            type: 'bar-x',
            data: [
                {x: 0, y: 1},
                {x: 1, y: 5},
            ],
            expected: [1, 5],
        },
        {
            type: 'waterfall',
            data: [
                {x: 0, y: 1},
                {x: 1, y: 5},
            ],
            expected: [1, 5],
        },
        {
            type: 'scatter',
            data: [
                {x: 0, y: 1},
                {x: 1, y: 5},
            ],
            expected: [1, 5],
        },
        {
            type: 'bar-y',
            data: [
                {x: 2, y: 'a'},
                {x: 8, y: 'b'},
            ],
            expected: [2, 8],
        },
        {
            type: 'pie',
            data: [
                {name: 'a', value: 10},
                {name: 'b', value: 40},
            ],
            expected: [10, 40],
        },
        {
            type: 'heatmap',
            data: [
                {x: 0, y: 0, value: 10},
                {x: 1, y: 1, value: 40},
            ],
            expected: [10, 40],
        },
        {
            type: 'funnel',
            data: [
                {name: 'a', value: 10},
                {name: 'b', value: 40},
            ],
            expected: [10, 40],
        },
        {
            type: 'x-range',
            data: [
                {x0: 0, x1: 5, y: 'a'},
                {x0: 10, x1: 12, y: 'b'},
            ],
            expected: [2, 5],
        },
    ])('computes [min, max] for "$type"', ({type, data, expected}) => {
        const series = [{type, data}] as Series;

        expect(getDomainForContinuousColorScale({series})).toEqual(expected);
    });

    test('flattens values across multiple series', () => {
        const series = [
            {
                type: 'scatter',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 5},
                ],
            },
            {
                type: 'line',
                data: [
                    {x: 0, y: 0},
                    {x: 1, y: 9},
                ],
            },
        ] as Series;

        expect(getDomainForContinuousColorScale({series})).toEqual([0, 9]);
    });

    test.each(['treemap', 'sankey', 'radar'])(
        'throws for the "%s" series which has no continuous color scale',
        (type) => {
            const series = [{type, data: [{name: 'a', value: 1}]}] as Series;

            expect(() => getDomainForContinuousColorScale({series})).toThrow(
                `The method for calculation a domain for a continuous color scale for the "${type}" series is not defined`,
            );
        },
    );
});
