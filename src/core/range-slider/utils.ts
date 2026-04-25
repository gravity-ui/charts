import type {PreparedRangeSlider} from '../axes/types';
import type {BrushSelection} from '../brush/types';
import type {PreparedChart} from '../chart/types';
import type {ChartScale} from '../scales/types';
import type {PreparedLegend} from '../series/types';
import {isBandScale} from '../utils';

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
    range?: [number, number];
    xScale?: ChartScale;
}): BrushSelection | undefined {
    const {range, xScale} = args;

    if (!range || !xScale || isBandScale(xScale)) {
        return undefined;
    }

    return [xScale(range[0]), xScale(range[1])];
}
