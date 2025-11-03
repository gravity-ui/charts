import merge from 'lodash/merge';

import {brushDefaults} from '../../constants';
import type {ChartRangeSlider} from '../../types';

import type {PreparedRangeSlider} from './types';

export function getPreparedRangeSlider({
    rangeSlider,
}: {
    rangeSlider?: ChartRangeSlider;
}): PreparedRangeSlider {
    return {
        brush: merge({}, brushDefaults, rangeSlider?.brush),
        enabled: rangeSlider?.enabled ?? false,
        height: rangeSlider?.height ?? 40,
        margin: rangeSlider?.margin ?? 10,
    };
}
