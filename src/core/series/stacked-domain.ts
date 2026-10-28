import {group} from 'd3-array';

import type {AxisDomainValue} from './plugin';
import {getSeriesStackId} from './utils';

interface StackedDomainSeries {
    stackId?: string;
    resolvedStackId?: string;
    stacking?: 'normal' | 'percent';
    data: readonly {x?: AxisDomainValue; y?: AxisDomainValue}[];
}

/** Accumulate each sign separately; plugins select the points and coordinate roles. */
export function getStackedDomainValues<T extends StackedDomainSeries>({
    series,
    categoryKey,
    valueKey,
    getData,
}: {
    series: readonly T[];
    categoryKey: 'x' | 'y';
    valueKey: 'x' | 'y';
    getData: (series: T) => T['data'];
}): number[] {
    const values: number[] = [];
    for (const seriesStack of group(series, getSeriesStackId).values()) {
        const positiveValues = new Map<string, number>();
        const negativeValues = new Map<string, number>();

        for (const singleSeries of seriesStack) {
            getData(singleSeries).forEach((point) => {
                const keyValue = point[categoryKey];
                if (keyValue === null) return;

                const key = String(keyValue);
                const rawValue = point[valueKey];
                const value = typeof rawValue === 'number' ? rawValue : 0;
                if (value >= 0) {
                    positiveValues.set(key, (positiveValues.get(key) ?? 0) + value);
                }
                if (value < 0) {
                    negativeValues.set(key, (negativeValues.get(key) ?? 0) + value);
                }
            });
        }

        for (const value of negativeValues.values()) values.push(value);
        for (const value of positiveValues.values()) values.push(value);
    }
    return values;
}
