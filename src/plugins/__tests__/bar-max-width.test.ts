import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {ChartData} from '../../types';

describe.each(['bar-x', 'bar-y'] as const)('%s width limit validation', (type) => {
    function config(barMaxWidth: unknown): ChartData {
        return {
            series: {
                data: [
                    {type, name: 'Plan', barMaxWidth: barMaxWidth as number, data: [{x: 1, y: 2}]},
                ],
            },
        };
    }

    test.each([undefined, 1, 1.5, 30, 1000])('accepts %s', (width) => {
        expect(() => validateData(config(width))).not.toThrow();
    });

    test.each([null, -1, 0, 0.5, NaN, Infinity, -Infinity, '30', '30px', '50%', false, {}, []])(
        'rejects %s',
        (width) => {
            expect(() => validateData(config(width))).toThrow(
                expect.objectContaining({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: expect.stringContaining('barMaxWidth'),
                }),
            );
        },
    );

    test.each([-1, 0, 0.5])('preserves legacy shared option validation for %s', (width) => {
        const data = config(undefined);
        data.series.options = {[type]: {barMaxWidth: width}};
        expect(() => validateData(data)).not.toThrow();
    });
});
