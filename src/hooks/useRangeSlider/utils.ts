import {isBandScale} from '../../utils';
import type {PreparedRangeSlider} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales';
import type {BrushSelection} from '../useBrush/types';
import type {PreparedLegend} from '../useSeries/types';

import type {RangeSliderState} from './types';

export function getRangeSliderOffsetTop(args: {
    height: number;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
}) {
    const {height, preparedLegend, preparedRangeSlider} = args;
    const legendHeight = preparedLegend?.enabled ? (preparedLegend?.height ?? 0) : 0;
    const legendMargin = preparedLegend?.enabled ? (preparedLegend?.margin ?? 0) : 0;

    return height - preparedRangeSlider.height - legendHeight - legendMargin;
}

export function getRangeSliderSelection(args: {
    rangeSliderState?: RangeSliderState;
    xScale?: ChartScale;
}): BrushSelection | undefined {
    const {rangeSliderState, xScale} = args;

    if (!rangeSliderState || !xScale || isBandScale(xScale)) {
        return undefined;
    }

    return [xScale(rangeSliderState.min), xScale(rangeSliderState.max)];
}
