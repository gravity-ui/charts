import type {ChartSeriesData, ChartXAxis} from '../../types';
import {getTooltipAxisValue} from '../utils';

const axis: ChartXAxis = {type: 'category', categories: ['First', 'Second']};

describe.each(['x', 'y'] as const)('getTooltipAxisValue on the %s axis', (direction) => {
    it('preserves null and undefined when there is no legacy category', () => {
        expect(getTooltipAxisValue({x: null, y: null}, direction, axis)).toBeNull();
        expect(getTooltipAxisValue({x: undefined, y: undefined}, direction, axis)).toBeUndefined();
    });

    it.each([-1, 2, 10, 0.5, NaN, Infinity, true, false, new Date(0)])(
        'returns undefined for an unresolvable category value %s',
        (value) => {
            const data = {[direction]: value} as unknown as ChartSeriesData;
            expect(getTooltipAxisValue(data, direction, axis)).toBeUndefined();
        },
    );

    it.each([null, undefined])('handles a missing category entry (%s)', (category) => {
        // JavaScript callers can supply entries outside the declared string[] contract.
        const categories = ['First', category] as unknown as string[];
        expect(getTooltipAxisValue({x: 1, y: 1}, direction, {...axis, categories})).toBeUndefined();
    });

    it.each([null, undefined])('uses data.category when the axis field is %s', (value) => {
        const data = {category: 'Legacy', x: value, y: value};
        expect(getTooltipAxisValue(data, direction, axis)).toBe('Legacy');
    });

    it('resolves legacy data without an axis field', () => {
        expect(getTooltipAxisValue({category: 'Legacy'}, direction, axis)).toBe('Legacy');
    });

    it('preserves valid indices, names and continuous values without mutating points', () => {
        const data = Object.freeze({x: 0, y: 0});
        expect(getTooltipAxisValue(data, direction, axis)).toBe('First');
        expect(getTooltipAxisValue({x: 'Named', y: 'Named'}, direction, axis)).toBe('Named');
        expect(getTooltipAxisValue(data, direction, {type: 'linear'})).toBe(0);
        expect(getTooltipAxisValue(data, direction, {type: 'datetime'})).toBe(0);
        expect(getTooltipAxisValue(data, direction)).toBe(0);
        expect(data).toEqual({x: 0, y: 0});
    });
});
