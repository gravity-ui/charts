import type {ChartSeriesData} from '../../types';
import {getDataCategoryValue, tryGetDataCategoryValue} from '../common';

describe.each(['x', 'y'] as const)('category resolution on the %s axis', (axisDirection) => {
    const categories = ['First', 'Second'];

    it.each([null, undefined, -1, 2, 0.5, NaN, Infinity, true, new Date(0)])(
        'keeps strict diagnostics for an unresolvable value %s',
        (value) => {
            const data = {[axisDirection]: value} as unknown as ChartSeriesData;
            const args = {axisDirection, categories, data};
            expect(tryGetDataCategoryValue(args)).toBeUndefined();
            expect(() => getDataCategoryValue(args)).toThrow(
                'It seems you are trying to get non-existing category value',
            );
        },
    );

    it.each([null, undefined])('rejects a missing category entry (%s)', (value) => {
        const args = {
            axisDirection,
            categories: ['First', value] as unknown as string[],
            data: {x: 1, y: 1},
        };
        expect(tryGetDataCategoryValue(args)).toBeUndefined();
        expect(() => getDataCategoryValue(args)).toThrow();
    });

    it.each([
        {data: {category: 'Legacy'}, expected: 'Legacy'},
        {data: {category: 'Legacy', x: null, y: null}, expected: 'Legacy'},
        {data: {category: 'Legacy', x: 'Named', y: 'Named'}, expected: 'Named'},
        {data: {category: 'Legacy', x: 1, y: 1}, expected: 'Second'},
        {data: {x: '', y: ''}, expected: ''},
        {data: {x: 0, y: 0}, expected: 'First'},
    ])('preserves category precedence for $data', ({data, expected}) => {
        const args = {axisDirection, categories, data: Object.freeze(data)};
        expect(tryGetDataCategoryValue(args)).toBe(expected);
        expect(getDataCategoryValue(args)).toBe(expected);
    });

    it('does not fall back to data.category for an invalid numeric index', () => {
        const args = {axisDirection, categories, data: {x: 5, y: 5, category: 'Legacy'}};
        expect(tryGetDataCategoryValue(args)).toBeUndefined();
        expect(() => getDataCategoryValue(args)).toThrow();
    });
});
