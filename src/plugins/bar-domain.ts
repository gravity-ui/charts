import type {BarXSeries, BarXSeriesData, BarYSeriesData} from '../types';

interface BarDomainSeries<T> {
    grouping?: boolean;
    stacking?: BarXSeries['stacking'];
    data: T[];
}

/** Independent overlays contribute their extrema, rather than a sum of duplicate categories. */
export function getBarDomainData<T extends BarXSeriesData | BarYSeriesData>(
    series: BarDomainSeries<T>,
    categoryKey: 'x' | 'y',
    valueKey: 'x' | 'y',
): T[] {
    if (series.grouping !== false || series.stacking) {
        return series.data;
    }

    const extrema = new Map<string, T>();
    for (const point of series.data) {
        const rawValue = point[valueKey];
        const value = typeof rawValue === 'number' ? rawValue : 0;
        if (Number.isNaN(value)) continue;
        const key = JSON.stringify([String(point[categoryKey]), value < 0]);
        const previous = extrema.get(key);
        const previousValue = previous?.[valueKey];
        const previousMagnitude = typeof previousValue === 'number' ? Math.abs(previousValue) : 0;
        if (!previous || Math.abs(value) > previousMagnitude) {
            extrema.set(key, point);
        }
    }
    return [...extrema.values()];
}
