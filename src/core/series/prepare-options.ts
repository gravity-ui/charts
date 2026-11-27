import {merge} from '~core/utils/merge';

import type {ChartSeriesOptions} from '../../types';

import {getRegisteredSeriesTypes, getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (options?: ChartSeriesOptions): PreparedSeriesOptions => {
    const defaults: Record<string, unknown> = {};
    for (const type of getRegisteredSeriesTypes()) {
        const {optionsDefaults} = getSeriesPlugin(type);
        if (optionsDefaults) {
            defaults[type] = optionsDefaults;
        }
    }
    return merge({}, defaults, options) as PreparedSeriesOptions;
};
