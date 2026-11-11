import {merge} from '~core/utils/merge';

import type {ChartSeriesOptions} from '../../types';

import {getRegisteredSeriesTypes, getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (options?: ChartSeriesOptions): PreparedSeriesOptions => {
    const defaults = Object.fromEntries(
        getRegisteredSeriesTypes().flatMap((type) => {
            const defaults = getSeriesPlugin(type).defaults;
            return defaults ? [[type, defaults]] : [];
        }),
    );
    return merge({} as PreparedSeriesOptions, defaults, options);
};
