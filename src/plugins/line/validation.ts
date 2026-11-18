import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../../libs';

export function validateLabelAnchor({series}: {series: {dataLabels?: {anchor?: unknown}}}) {
    const anchor = series.dataLabels?.anchor;
    if (anchor !== undefined && anchor !== 'center' && anchor !== 'marker-edge') {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'dataLabels.anchor',
                values: ['center', 'marker-edge'],
            }),
        });
    }
}
