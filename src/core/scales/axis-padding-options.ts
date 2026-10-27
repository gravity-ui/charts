import type {ChartAxis} from '../types';
import {parseNonNegativeSize} from '../utils/math';

import type {ChartScaleLinear} from './types';

/** Resolve percentages before band/label offsets and tick rounding. */
export function getDomainPadding(axis: Pick<ChartAxis, 'type' | 'padding' | 'maxPadding'>) {
    const min = parseNonNegativeSize(axis.padding?.min);
    const max = parseNonNegativeSize(axis.padding?.max);
    let maxFraction = 0;
    if (max?.unit === '%') maxFraction = max.value / 100;
    else if (axis.padding?.max === undefined || axis.type === 'category')
        maxFraction = axis.maxPadding ?? 0;
    return {
        min: min?.unit === '%' ? min.value / 100 : 0,
        max: maxFraction,
        maxIsPercentage: max?.unit === '%',
    };
}

/** Extrapolate a logarithmic endpoint using the initial scale's pixel range. */
export function getLogarithmicPaddedValue(
    scale: ChartScaleLinear,
    offset: number,
    side: 'min' | 'max',
) {
    const domain = scale.domain();
    const range = scale.range();
    const span = Math.abs(range[1] - range[0]);
    const index = side === 'min' ? 0 : 1;
    if (!span || !offset || Number.isNaN(offset) || domain[0] === domain[1]) return domain[index];

    const logSpan = Math.log(domain[1]) - Math.log(domain[0]);
    const expansion = (Math.abs(offset) / span) * logSpan;
    const value = Math.log(domain[index]) + (side === 'min' ? -expansion : expansion);
    // Keep even excessive percentage requests positive and finite.
    return Math.exp(
        Math.max(Math.log(Number.MIN_VALUE), Math.min(Math.log(Number.MAX_VALUE), value)),
    );
}

/** Percentages have already been applied by the scale builder. */
export function getVisualPadding(value: string | number | undefined) {
    return parseNonNegativeSize(value)?.unit === '%' ? undefined : value;
}
