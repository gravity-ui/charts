import merge from 'lodash/merge';

import {seriesOptionsDefaults} from '../../constants';
import type {ChartSeriesOptions} from '../../types';

import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (options?: ChartSeriesOptions): PreparedSeriesOptions => {
    return merge({}, seriesOptionsDefaults, options);
};
