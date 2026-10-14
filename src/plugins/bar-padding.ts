import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';

export function validateBarPadding(padding: number | undefined) {
    if (padding === undefined) return;

    if (typeof padding !== 'number' || !Number.isFinite(padding) || padding < 0 || padding > 1) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'barPadding',
                values: 'a finite number in [0, 1]',
            }),
        });
    }
}
