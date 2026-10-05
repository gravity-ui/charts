import {getTooltipAxisValue} from '~core/tooltip/utils';

import type {ChartXAxis, TooltipDataChunkBarY} from '../../../../types';
import {getHoveredValues, getSortedHovered} from '../utils';

const axis: ChartXAxis = {type: 'category', categories: ['First', 'Second']};

it.each(['x', 'y'] as const)(
    'preserves missing %s values before resolving categories',
    (direction) => {
        expect(getTooltipAxisValue({x: null, y: null}, direction, axis)).toBeNull();
        expect(getTooltipAxisValue({x: undefined, y: undefined}, direction, axis)).toBeUndefined();
    },
);

it.each([-1, 2, 10, 0.5, NaN])('returns null for unknown category index %s', (value) => {
    expect(getTooltipAxisValue({x: value, y: value}, 'x', axis)).toBeNull();
    expect(getTooltipAxisValue({x: value, y: value}, 'y', axis)).toBeNull();
});

it('preserves valid indices, named categories and continuous values without changing points', () => {
    const data = {x: 0, y: 1};
    expect(getTooltipAxisValue(data, 'x', axis)).toBe('First');
    expect(getTooltipAxisValue(data, 'y', axis)).toBe('Second');
    expect(getTooltipAxisValue({x: 'Named', y: 0}, 'x', axis)).toBe('Named');
    expect(getTooltipAxisValue(data, 'x', {type: 'linear'})).toBe(0);
    expect(getTooltipAxisValue(data, 'y', {type: 'datetime'})).toBe(1);
    expect(data).toEqual({x: 0, y: 1});
});

it('sorts bar-y hover chunks with missing X values without throwing', () => {
    const hovered: TooltipDataChunkBarY[] = [1, null, undefined, 10, 0].map((x, i) => ({
        data: {x, y: 0},
        series: {type: 'bar-y', name: String(i), data: []},
    }));
    const sorted = getSortedHovered({
        hovered,
        xAxis: axis,
        sorting: {key: 'value', direction: 'asc'},
    });
    expect(sorted).toEqual([hovered[1], hovered[2], hovered[3], hovered[4], hovered[0]]);
    expect(getHoveredValues({hovered: sorted, xAxis: axis})).toEqual([
        null,
        undefined,
        null,
        'First',
        'Second',
    ]);
});
