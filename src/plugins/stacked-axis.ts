import type {FixedAxisDomain} from '~core/series/axis-contract';

/** Percent stacks use a linear normalized domain, including with configured log axes. */
export function getPercentStackDomain({
    series,
}: {
    series: readonly {stacking?: 'normal' | 'percent'}[];
}): FixedAxisDomain | undefined {
    return series.some((item) => item.stacking === 'percent')
        ? {min: 0, max: 100, type: 'linear'}
        : undefined;
}
