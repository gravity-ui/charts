import {i18n} from '~core/i18n';
import {getSeriesStackId} from '~core/series/utils';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {AreaSeries, ChartSeries, SeriesInterpolation} from '../../types';
import {validateInterpolation} from '../interpolation/validation';

/**
 * Returns a normalized key for checking that interpolation settings match within an area stack.
 */
function getNormalizedInterpolationKey(interpolation?: SeriesInterpolation) {
    switch (interpolation?.type) {
        case 'cardinal':
            return `cardinal:${interpolation.tension ?? 0}`;
        case 'step':
            return `step:${interpolation.position ?? 'after'}`;
        default:
            return interpolation?.type ?? 'linear';
    }
}

export function validateAreaInterpolation(series: AreaSeries, allSeries: ChartSeries[]) {
    validateInterpolation({series});
    if (!series.stacking && !series.stackId) {
        return;
    }

    const stackId = getSeriesStackId(series);
    const interpolation = getNormalizedInterpolationKey(series.interpolation);
    for (const other of allSeries) {
        if (
            other.type !== 'area' ||
            (other.yAxis ?? 0) !== (series.yAxis ?? 0) ||
            getSeriesStackId(other) !== stackId
        ) {
            continue;
        }
        validateInterpolation({series: other});
        if (getNormalizedInterpolationKey(other.interpolation) !== interpolation) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-series-property', {
                    key: 'interpolation',
                    values: 'identical interpolation settings within an area stack',
                }),
            });
        }
    }
}
