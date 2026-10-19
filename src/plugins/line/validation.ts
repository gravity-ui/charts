import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../../libs';

const AVAILABLE_INTERPOLATION_TYPES = ['linear', 'monotone', 'cardinal'];

interface ValidatableLineSeries {
    interpolation?: unknown;
    dataLabels?: {anchor?: unknown};
}

interface ValidateLineSeriesArgs {
    series: ValidatableLineSeries;
}

function throwInvalidSeriesProperty(key: string, values: string | string[]): never {
    throw new ChartError({
        code: CHART_ERROR_CODE.INVALID_DATA,
        message: i18n('error', 'label_invalid-series-property', {key, values}),
    });
}

export function validateInterpolation({series}: ValidateLineSeriesArgs) {
    const {interpolation} = series;
    if (interpolation === undefined) {
        return;
    }

    if (
        typeof interpolation !== 'object' ||
        interpolation === null ||
        Array.isArray(interpolation)
    ) {
        throwInvalidSeriesProperty('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    const {type, tension} = interpolation as {tension?: unknown; type?: unknown};
    if (typeof type !== 'string' || !AVAILABLE_INTERPOLATION_TYPES.includes(type)) {
        throwInvalidSeriesProperty('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    if (
        type === 'cardinal' &&
        tension !== undefined &&
        (typeof tension !== 'number' || !Number.isFinite(tension) || tension < 0 || tension > 1)
    ) {
        throwInvalidSeriesProperty('interpolation.tension', '0 ≤ tension ≤ 1');
    }
}

export function validateLabelAnchor({series}: ValidateLineSeriesArgs) {
    const anchor = series.dataLabels?.anchor;
    if (anchor !== undefined && anchor !== 'center' && anchor !== 'marker-edge') {
        throwInvalidSeriesProperty('dataLabels.anchor', ['center', 'marker-edge']);
    }
}
