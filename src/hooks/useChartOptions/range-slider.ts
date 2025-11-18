import merge from 'lodash/merge';

import {brushDefaults} from '../../constants';
import type {ChartRangeSlider, ChartXAxis} from '../../types';

import type {PreparedRangeSlider} from './types';

const DEFAULT_RANGE_SLIDER_HEIGHT = 40;
const DEFAULT_RANGE_SLIDER_MARGIN = 10;

export function getPreparedRangeSlider({
    rangeSlider,
    xAxis,
}: {
    rangeSlider?: ChartRangeSlider;
    xAxis?: ChartXAxis;
}): PreparedRangeSlider {
    const enabled = xAxis?.type === 'category' ? false : (rangeSlider?.enabled ?? false);

    return {
        brush: merge({}, brushDefaults, rangeSlider?.brush),
        defaultMax: rangeSlider?.defaultMax,
        defaultMin: rangeSlider?.defaultMin,
        enabled,
        height: rangeSlider?.height ?? DEFAULT_RANGE_SLIDER_HEIGHT,
        margin: rangeSlider?.margin ?? DEFAULT_RANGE_SLIDER_MARGIN,
    };
}
