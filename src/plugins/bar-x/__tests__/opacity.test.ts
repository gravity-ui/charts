import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../../libs';
import type {BarXSeries, ChartData, ChartSeriesOptions} from '../../../types';

describe('bar-x opacity', () => {
    const type = 'bar-x' as const;
    describe.each(['series', 'options'] as const)('%s', (source) => {
        function config(opacity: unknown): ChartData {
            return {
                series: {
                    data: [
                        {
                            type,
                            name: 'Plan',
                            opacity: source === 'series' ? opacity : 0.3,
                            data: [{x: 10, y: 20}],
                        },
                    ] as BarXSeries[],
                    options:
                        source === 'options'
                            ? ({[type]: {opacity}} as ChartSeriesOptions)
                            : undefined,
                },
            };
        }

        test.each([undefined, null, 0, 0.3, 1])('accepts %s', (opacity) => {
            expect(() => validateData(config(opacity))).not.toThrow();
        });

        test.each([-0.1, 1.1, NaN, Infinity, '0.3'])(
            'rejects %s, including on hidden series',
            (opacity) => {
                const data = config(opacity);
                data.series.data[0].visible = false;
                expect(() => validateData(data)).toThrow(
                    expect.objectContaining({code: CHART_ERROR_CODE.INVALID_DATA}),
                );
            },
        );
    });
});
