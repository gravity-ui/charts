import merge from 'lodash/merge';

import {seriesOptionsDefaults} from '../../constants';
import type {ChartKitWidgetSeriesOptions} from '../../types';

import type {PreparedSeriesOptions} from './types';

export const getPreparedOptions = (
    options?: ChartKitWidgetSeriesOptions,
): PreparedSeriesOptions => {
    return merge({}, seriesOptionsDefaults, options);
};
