import type {ChartAxis} from '../types';
import {parseNonNegativeSize} from '../utils/math';

import type {ChartScaleLinear, ChartScaleTime} from './types';

interface DomainPadding {
    min: number;
    max: number;
    maxIsPercentage: boolean;
}

/** Resolve percentages before band/label offsets and tick rounding. */
export function getDomainPadding(
    axis: Pick<ChartAxis, 'type' | 'padding' | 'maxPadding'>,
): DomainPadding {
    if (axis.type === 'category') {
        return {min: 0, max: axis.maxPadding ?? 0, maxIsPercentage: false};
    }
    const min = parseNonNegativeSize(axis.padding?.min);
    const max = parseNonNegativeSize(axis.padding?.max);
    let maxFraction = 0;
    if (max?.unit === '%') maxFraction = max.value / 100;
    else if (axis.padding?.max === undefined) maxFraction = axis.maxPadding ?? 0;
    return {
        min: min?.unit === '%' ? min.value / 100 : 0,
        max: maxFraction,
        maxIsPercentage: max?.unit === '%',
    };
}

/** Extrapolate a logarithmic endpoint using the initial scale's pixel range. */
function getLogarithmicPaddedValue(
    scale: ChartScaleLinear | ChartScaleTime,
    offset: number,
    side: 'min' | 'max',
) {
    const domain = scale.domain().map(Number);
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

/** Back off only percentage requests when their expansion cannot be represented by the scale. */
export function getPaddedDomain(args: {
    scale: ChartScaleLinear | ChartScaleTime;
    /** Bounds before a datetime scale truncates fractional milliseconds. */
    domain: [number, number];
    type: ChartAxis['type'];
    padding: DomainPadding;
    size: number;
    offsetMin: number;
    offsetMax: number;
    isMinSpecified: boolean;
    isMaxSpecified: boolean;
}): number[] {
    const {
        scale,
        domain,
        type,
        padding,
        size,
        offsetMin,
        offsetMax,
        isMinSpecified,
        isMaxSpecified,
    } = args;
    const zero = Number(scale.invert(0));
    let minFraction = isMinSpecified ? 0 : padding.min;
    let maxFraction = isMaxSpecified || !padding.maxIsPercentage ? 0 : padding.max;
    const legacyMax = padding.maxIsPercentage ? 0 : size * padding.max;
    const candidate = minFraction || maxFraction ? scale.copy() : undefined;
    const range = scale.range();

    while (true) {
        const minOffset = size * minFraction + offsetMin;
        const maxOffset = size * maxFraction + legacyMax + offsetMax;
        let min = domain[0];
        let max = domain[1];
        if (!isMinSpecified) {
            min =
                type === 'logarithmic' && minFraction > 0
                    ? getLogarithmicPaddedValue(scale, minOffset, 'min')
                    : domain[0] - Math.abs(Number(scale.invert(minOffset)) - zero);
        }
        if (!isMaxSpecified) {
            max =
                type === 'logarithmic' && maxFraction > 0
                    ? getLogarithmicPaddedValue(scale, maxOffset, 'max')
                    : domain[1] + Math.abs(Number(scale.invert(maxOffset)) - zero);
        }
        const nextDomain = [min, max];
        // Preserve the legacy path, including degenerate domains and bar/label offsets.
        if (!candidate || (!minFraction && !maxFraction)) return nextDomain;
        candidate.domain(nextDomain);
        const positions = domain.map((value) => candidate(value));
        if (
            nextDomain.every(Number.isFinite) &&
            candidate.domain().every((value) => Number.isFinite(Number(value))) &&
            positions.every(Number.isFinite) &&
            (domain[0] === domain[1] || range[0] === range[1] || positions[0] !== positions[1])
        ) {
            return nextDomain;
        }
        minFraction /= 2;
        maxFraction /= 2;
    }
}

/** Percentages have already been applied by the scale builder. */
export function getVisualPadding(value: string | number | undefined) {
    return parseNonNegativeSize(value)?.unit === '%' ? undefined : value;
}
