import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../../libs';

const AVAILABLE_INTERPOLATION_TYPES = ['linear', 'monotone', 'cardinal'];

interface ValidatableLineSeries {
    interpolation?: unknown;
}

interface ValidateInterpolationArgs {
    series: ValidatableLineSeries;
}

function throwInvalidInterpolation(key: string, values: string | string[]): never {
    throw new ChartError({
        code: CHART_ERROR_CODE.INVALID_DATA,
        message: i18n('error', 'label_invalid-series-property', {key, values}),
    });
}

export function validateInterpolation({series}: ValidateInterpolationArgs) {
    const {interpolation} = series;
    if (interpolation === undefined) {
        return;
    }

    if (
        typeof interpolation !== 'object' ||
        interpolation === null ||
        Array.isArray(interpolation)
    ) {
        throwInvalidInterpolation('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    const {type, tension} = interpolation as {tension?: unknown; type?: unknown};
    if (typeof type !== 'string' || !AVAILABLE_INTERPOLATION_TYPES.includes(type)) {
        throwInvalidInterpolation('interpolation.type', AVAILABLE_INTERPOLATION_TYPES);
    }

    if (
        type === 'cardinal' &&
        tension !== undefined &&
        (typeof tension !== 'number' || !Number.isFinite(tension) || tension < 0 || tension > 1)
    ) {
        throwInvalidInterpolation('interpolation.tension', '0 ≤ tension ≤ 1');
    }
}
