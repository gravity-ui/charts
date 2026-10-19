import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {ChartData} from '../../types';

describe.each(['bar-x', 'bar-y'] as const)('%s padding validation', (type) => {
    function config(barPadding: unknown): ChartData {
        return {
            series: {
                data: [
                    {type, name: 'Plan', barPadding: barPadding as number, data: [{x: 1, y: 2}]},
                ],
            },
        };
    }

    test.each([undefined, 0, 0.2, 1])('accepts %s', (padding) => {
        expect(() => validateData(config(padding))).not.toThrow();
    });

    test.each([null, -0.1, 1.1, NaN, Infinity, -Infinity, '0.2', false, {}, []])(
        'rejects %s',
        (padding) => {
            expect(() => validateData(config(padding))).toThrow(
                expect.objectContaining({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: expect.stringContaining('barPadding'),
                }),
            );
        },
    );

    test('preserves legacy type-level validation', () => {
        const data = config(undefined);
        data.series.options = {[type]: {barPadding: 2}};
        expect(() => validateData(data)).not.toThrow();
    });
});
