import {
    GRAVITY_CHART_ERROR_CODE,
    GravityChartError,
    isGravityChartError,
} from '../gravity-chart-error';
import type {GravityChartErrorArgs} from '../gravity-chart-error';

describe('libs/chartkit-error', () => {
    test.each<[unknown, boolean] /* [error, expected] */>([
        [new GravityChartError(), true],
        [new Error(), false],
        [null, false],
        [undefined, false],
    ])('isChartKitError (args: %j)', (error, expected) => {
        const result = isGravityChartError(error);
        expect(result).toEqual(expected);
    });

    test.each<
        [GravityChartErrorArgs | undefined, GravityChartErrorArgs['code']] /* [args, expected] */
    >([
        [undefined, GRAVITY_CHART_ERROR_CODE.UNKNOWN],
        [{code: GRAVITY_CHART_ERROR_CODE.NO_DATA}, GRAVITY_CHART_ERROR_CODE.NO_DATA],
    ])('check ChartKitError code (args: %j)', (args, expected) => {
        let result: GravityChartErrorArgs['code'] = '';

        try {
            throw new GravityChartError(args);
        } catch (error) {
            if (isGravityChartError(error)) {
                result = error.code;
            }
        }

        expect(result).toEqual(expected);
    });
});
