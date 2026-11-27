import sortBy from 'es-toolkit/compat/sortBy';

import type {PreparedWaterfallSeries, PreparedWaterfallSeriesData} from './prepared-series';
import type {WaterfallInterval} from './types';
import {getWaterfallPointRole} from './utils';

export function resolveWaterfallIntervals(points: readonly PreparedWaterfallSeriesData[]) {
    const intervals = new Map<PreparedWaterfallSeriesData, WaterfallInterval>();
    let balance = 0;
    let previousIndex: number | undefined;

    for (const point of points) {
        const change = getWaterfallPointRole(point) === 'change';
        const start = change ? balance : 0;
        if (change) {
            const {y} = point;
            if (typeof y !== 'number') continue;
            balance += y;
        }
        intervals.set(point, {start, end: balance, previousIndex});
        previousIndex = point.index;
    }

    return intervals;
}

const intervalCache = new WeakMap<
    readonly PreparedWaterfallSeriesData[],
    {
        dataArrays: (readonly PreparedWaterfallSeriesData[])[];
        intervals: ReadonlyMap<PreparedWaterfallSeriesData, WaterfallInterval>;
    }
>();
const emptyIntervals: ReadonlyMap<PreparedWaterfallSeriesData, WaterfallInterval> = new Map();

export function getWaterfallIntervals(
    series: readonly PreparedWaterfallSeries[],
): ReadonlyMap<PreparedWaterfallSeriesData, WaterfallInterval> {
    const visible = series.filter((item) => item.visible);
    const selected = visible.length ? visible : series;
    const dataArrays = selected.map((item) => item.fullData);
    if (!dataArrays.length) return emptyIntervals;

    const cached = intervalCache.get(dataArrays[0]);
    if (
        cached?.dataArrays.length === dataArrays.length &&
        cached.dataArrays.every((data, index) => data === dataArrays[index])
    ) {
        return cached.intervals;
    }

    // Legend groups split the steps by sign. Restore process order before computing balances.
    const points = sortBy(dataArrays.flat(), (point) => point.index);
    const intervals = resolveWaterfallIntervals(points);
    intervalCache.set(dataArrays[0], {dataArrays, intervals});
    return intervals;
}
