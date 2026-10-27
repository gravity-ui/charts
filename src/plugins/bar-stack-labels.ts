import {i18n} from '~core/i18n';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import {sumDecimals} from '~core/utils/math';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {BarStackLabelsOptions, BarXSeries, BarYSeries} from '../types';

interface BarStackLabelTotalOptions<T> {
    valueAxis: 'x' | 'y';
    custom: boolean;
    hasNegativeStack: boolean;
    isEnabled: (point: T) => boolean;
}

export function getBarStackLabelTotal<T extends PreparedBarXData | PreparedBarYData>(
    points: T[],
    {valueAxis, custom, hasNegativeStack, isEnabled}: BarStackLabelTotalOptions<T>,
) {
    const values: number[] = [];

    for (const point of points) {
        if (custom && !isEnabled(point)) continue;

        const value = custom ? point.data.stackLabelValue : Number(point.data[valueAxis]);
        if (typeof value === 'number' && Number.isFinite(value)) values.push(value);
    }

    if (!values.length) return undefined;

    const total = sumDecimals(values);

    // An all-zero geometric side does not add a label beside a negative stack.
    // A zero custom sum on a nonzero stack remains meaningful.
    const zeroSide = custom ? points.every((point) => point.data[valueAxis] === 0) : total === 0;
    if (hasNegativeStack && zeroSide) return undefined;

    return total;
}

/** Validate bar-specific input before preparing points or summing custom values. */
export function validateBarStackLabels(
    series: BarXSeries | BarYSeries,
    defaults?: BarStackLabelsOptions,
) {
    for (const valueSource of [defaults?.valueSource, series.stackLabels?.valueSource]) {
        if (valueSource !== undefined && valueSource !== 'value' && valueSource !== 'custom') {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-series-property', {
                    key: 'stackLabels.valueSource',
                    values: "'value' or 'custom'",
                }),
            });
        }
    }

    series.data.forEach((point, index) => {
        const value = point.stackLabelValue;
        if (
            value !== undefined &&
            value !== null &&
            (typeof value !== 'number' || !Number.isFinite(value))
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_invalid-series-property', {
                    key: `data[${index}].stackLabelValue`,
                    values: 'null or a finite number',
                }),
            });
        }
    });
}
