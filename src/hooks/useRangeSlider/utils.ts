import {isBandScale} from '../../utils';
import type {ChartScale} from '../useAxisScales';
import type {BrushSelection} from '../useBrush/types';
import type {PreparedRangeSlider} from '../useChartOptions/types';
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

export function getDefaultRangeSliderSelection(args: {
    boundsWidth: number;
    defaultMax?: number;
    defaultMin?: number;
    xScale?: ChartScale;
}): BrushSelection | undefined {
    const {boundsWidth, defaultMax, defaultMin, xScale} = args;

    if (!xScale || isBandScale(xScale)) {
        return undefined;
    }

    return [
        typeof defaultMin === 'number' ? xScale(defaultMin) : 0,
        typeof defaultMax === 'number' ? xScale(defaultMax) : boundsWidth,
    ] as [number, number];
}
