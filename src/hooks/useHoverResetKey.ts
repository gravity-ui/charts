import React from 'react';

import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '~core/series/types';

import type {PreparedXAxis, PreparedYAxis} from './useAxis/types';

interface Args {
    seriesData: PreparedSeries[] | undefined;
    xAxis?: PreparedXAxis | null;
    yAxes: (PreparedYAxis | undefined)[];
}

/** Keep the identity across layout changes; invalidate points when their source or mapping changes. */
export function useHoverResetKey({seriesData, xAxis, yAxes}: Args) {
    const axes = [xAxis, ...yAxes].map((axis) => ({
        type: axis?.type ?? 'linear',
        categories: axis?.type === 'category' ? (axis.categories ?? []) : undefined,
    }));
    const [key, setKey] = React.useState({seriesData, axes});

    if (key.seriesData !== seriesData || !isEqual(key.axes, axes)) {
        setKey({seriesData, axes});
    }

    return key;
}
