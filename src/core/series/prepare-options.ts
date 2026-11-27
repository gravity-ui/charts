import {merge} from '~core/utils/merge';

import type {ChartSeriesOptions} from '../../types';
import {seriesOptionsDefaults} from '../constants';

import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (options?: ChartSeriesOptions): PreparedSeriesOptions => {
    const overrides = Object.entries(options ?? {}).flatMap(([type, fields]) => {
        if (!fields) return [];
        const entries = Object.entries(fields).filter(
            ([key, value]) =>
                value !== null ||
                (key !== 'barPadding' && key !== 'barMaxWidth' && key !== 'groupPadding'),
        );
        return [[type, Object.fromEntries(entries)]];
    });
    return merge({}, seriesOptionsDefaults, Object.fromEntries(overrides));
};
