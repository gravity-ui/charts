import {merge} from '~core/utils/merge';

import type {ChartSeriesOptions} from '../../types';
import {seriesOptionsDefaults} from '../constants';

import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (options?: ChartSeriesOptions): PreparedSeriesOptions => {
    return merge({}, seriesOptionsDefaults, options);
};
