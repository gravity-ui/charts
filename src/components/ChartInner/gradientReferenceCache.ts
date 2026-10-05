import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '~core/series/types';

import type {GradientLayoutReference} from '../../hooks/useShapes/types';

export interface GradientReferenceCacheEntry {
    data: GradientLayoutReference;
    allPreparedSeries: PreparedSeries[];
    width: number;
    height: number;
    activeLegendItems: string[];
}

/** Zoom changes the view, not the full-series gradient reference. */
export function isGradientReferenceCurrent(
    entry: GradientReferenceCacheEntry | undefined,
    next: Omit<GradientReferenceCacheEntry, 'data'>,
) {
    return Boolean(
        entry &&
        entry.width === next.width &&
        entry.height === next.height &&
        entry.allPreparedSeries === next.allPreparedSeries &&
        isEqual(entry.activeLegendItems, next.activeLegendItems),
    );
}
