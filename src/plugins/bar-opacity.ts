import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';

export function validateBarOpacity(opacity: number | null | undefined, key: string) {
    if (opacity === undefined || opacity === null) return;

    if (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key,
                values: 'null or a finite number in [0, 1]',
            }),
        });
    }
}
