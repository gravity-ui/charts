import {group} from 'd3-array';

import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';

export function resolveStackBarSizing<T extends {barPadding: number; barMaxWidth: number}>(
    series: T[],
    getStackKey: (series: T) => string,
) {
    const preparedSeries = series.map((s) => ({
        ...s,
        stackBarPadding: s.barPadding,
        stackBarMaxWidth: s.barMaxWidth,
    }));
    for (const stack of group(preparedSeries, getStackKey).values()) {
        const padding = stack.reduce(
            (value, s) => Math.max(value, s.barPadding),
            stack[0].barPadding,
        );
        const maxWidth = stack.reduce(
            (value, s) => Math.min(value, s.barMaxWidth),
            stack[0].barMaxWidth,
        );
        stack.forEach((s) => {
            s.stackBarPadding = padding;
            s.stackBarMaxWidth = maxWidth;
        });
    }

    return preparedSeries;
}

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

// Keep the numeric pixel contract of the existing shared barMaxWidth option.
export function validateBarMaxWidth(width: number | undefined) {
    if (width === undefined) return;

    if (typeof width !== 'number' || !Number.isFinite(width) || width < 0) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'barMaxWidth',
                values: 'a finite nonnegative number of pixels',
            }),
        });
    }
}
