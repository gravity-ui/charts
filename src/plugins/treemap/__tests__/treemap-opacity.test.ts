import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../../libs';
import type {ChartData, TreemapSeriesData} from '../../../types';

function config(opacity: unknown): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'treemap',
                    name: 'Values',
                    data: [{name: 'Value', value: 10, opacity} as TreemapSeriesData],
                },
            ],
        },
    };
}

describe('treemap point opacity', () => {
    test.each([undefined, 0, 0.5, 1])('accepts %s', (opacity) => {
        expect(() => validateData(config(opacity))).not.toThrow();
    });

    test.each([-1, 2, NaN, Infinity, -Infinity, null, '0.5'])('rejects %s', (opacity) => {
        expect(() => validateData(config(opacity))).toThrow(
            expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
        );
    });
});
