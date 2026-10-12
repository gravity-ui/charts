import {scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3-scale';

import type {PreparedAxis} from '../../axes/types';
import {getExplicitAxisTickValues} from '../axis/common';

function getAxis(type: PreparedAxis['type'], values?: (number | string)[]): PreparedAxis {
    return {type, ticks: {values}} as PreparedAxis;
}

describe('getExplicitAxisTickValues', () => {
    test('deduplicates, sorts and clips linear values in domain space', () => {
        const scale = scaleLinear().domain([0, 100]).range([100, 0]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('linear', [50, 10, 50, -10, 110]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(10), value: 10},
            {position: scale(50), value: 50},
        ]);
    });

    test('supports datetime values', () => {
        const scale = scaleUtc()
            .domain([new Date(0), new Date(1000)])
            .range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('datetime', [1000, -1, 500, 500]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(500), value: 500},
            {position: scale(1000), value: 1000},
        ]);
    });

    test('drops invalid logarithmic values', () => {
        const scale = scaleLog().domain([1, 100]).range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('logarithmic', [-1, 0, 1, 10, 100, 1000]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(1), value: 1},
            {position: scale(10), value: 10},
            {position: scale(100), value: 100},
        ]);
    });

    test('orders category values by the scale domain', () => {
        const scale = scaleBand().domain(['C', 'B']).range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('category', ['A', 'B', 'C', 'B']),
            scale,
        });

        expect(result).toEqual([
            {position: (scale('C') ?? 0) + scale.bandwidth() / 2, value: 'C'},
            {position: (scale('B') ?? 0) + scale.bandwidth() / 2, value: 'B'},
        ]);
    });

    test('supports an empty values array and a zero-sized range', () => {
        expect(
            getExplicitAxisTickValues({
                axis: getAxis('linear', []),
                scale: scaleLinear().domain([0, 100]).range([0, 100]),
            }),
        ).toEqual([]);
        expect(
            getExplicitAxisTickValues({
                axis: getAxis('linear', [0, 50, 100]),
                scale: scaleLinear().domain([0, 100]).range([0, 0]),
            }),
        ).toEqual([]);
    });
});
