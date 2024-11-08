import {CHART_ERROR_CODE, ChartError, isChartError} from '..';
import type {ChartErrorArgs} from '..';

describe('libs/chart-error', () => {
    test.each<[unknown, boolean] /* [error, expected] */>([
        [new ChartError(), true],
        [new Error(), false],
        [null, false],
        [undefined, false],
    ])('isChartError (args: %j)', (error, expected) => {
        const result = isChartError(error);
        expect(result).toEqual(expected);
    });

    test.each<[ChartErrorArgs | undefined, ChartErrorArgs['code']] /* [args, expected] */>([
        [undefined, CHART_ERROR_CODE.UNKNOWN],
        [{code: CHART_ERROR_CODE.NO_DATA}, CHART_ERROR_CODE.NO_DATA],
    ])('check ChartError code (args: %j)', (args, expected) => {
        let result: ChartErrorArgs['code'] = '';

        try {
            throw new ChartError(args);
        } catch (error) {
            if (isChartError(error)) {
                result = error.code;
            }
        }

        expect(result).toEqual(expected);
    });
});
