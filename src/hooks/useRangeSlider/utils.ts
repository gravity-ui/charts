import type {ChartScale} from '~core/scales/types';
import type {PreparedLegend} from '~core/series/types';
import {isBandScale} from '~core/utils';

import type {PreparedChart} from '../types';
import type {PreparedRangeSlider} from '../useAxis/types';
import type {BrushSelection} from '../useBrush/types';

import type {RangeSliderState} from './types';

export function getRangeSliderOffsetTop(args: {
    height: number;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
}) {
    const {height, preparedChart, preparedLegend, preparedRangeSlider} = args;
    const legendHeight = preparedLegend?.enabled ? (preparedLegend?.height ?? 0) : 0;
    const legendMargin = preparedLegend?.enabled ? (preparedLegend?.margin ?? 0) : 0;

    return (
        height -
        preparedRangeSlider.height -
        legendHeight -
        legendMargin -
        preparedChart.margin.bottom
    );
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
