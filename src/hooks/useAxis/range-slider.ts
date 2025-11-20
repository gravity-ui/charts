import merge from 'lodash/merge';

import {brushDefaults} from '../../constants';
import type {ChartXAxis} from '../../types';

import type {PreparedRangeSlider} from './types';

const DEFAULT_RANGE_SLIDER_HEIGHT = 40;
const DEFAULT_RANGE_SLIDER_MARGIN = 10;

export function getPreparedRangeSlider({xAxis}: {xAxis?: ChartXAxis}): PreparedRangeSlider {
    const rangeSlider = xAxis?.rangeSlider;
    const enabled = xAxis?.type === 'category' ? false : (rangeSlider?.enabled ?? false);

    return {
        brush: merge({}, brushDefaults, rangeSlider?.brush),
        defaultRange: rangeSlider?.defaultRange,
        enabled,
        height: rangeSlider?.height ?? DEFAULT_RANGE_SLIDER_HEIGHT,
        margin: rangeSlider?.margin ?? DEFAULT_RANGE_SLIDER_MARGIN,
    };
}
