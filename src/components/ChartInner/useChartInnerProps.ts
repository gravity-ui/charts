import React from 'react';

import type {Dispatch} from 'd3';

import {
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    usePrevious,
    useSeries,
    useShapes,
    useSplit,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getPreparedXAxis} from '../../hooks/useChartOptions/x-axis';
import {getPreparedYAxis} from '../../hooks/useChartOptions/y-axis';

import type {ChartInnerProps} from './types';

type Props = ChartInnerProps & {
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
};

export function useChartInnerProps(props: Props) {
    const {width, height, data, dispatcher, htmlLayout} = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const {chart, title, tooltip} = useChartOptions({data});
    const xAxis = React.useMemo(
        () => getPreparedXAxis({xAxis: data.xAxis, width, series: data.series.data}),
        [data, width],
    );
    const yAxis = React.useMemo(
        () =>
            getPreparedYAxis({
                series: data.series.data,
                yAxis: data.yAxis,
                height,
            }),
        [data, height],
    );
    const {
        legendItems,
        legendConfig,
        preparedSeries,
        preparedSeriesOptions,
        preparedLegend,
        handleLegendItemClick,
    } = useSeries({
        chartWidth: width,
        chartHeight: height,
        chartMargin: chart.margin,
        series: data.series,
        legend: data.legend,
        preparedYAxis: yAxis,
    });
    const {boundsWidth, boundsHeight} = useChartDimensions({
        width,
        height,
        margin: chart.margin,
        preparedLegend,
        preparedXAxis: xAxis,
        preparedYAxis: yAxis,
        preparedSeries: preparedSeries,
    });
    const preparedSplit = useSplit({split: data.split, boundsHeight, chartWidth: width});
    const {xScale, yScale} = useAxisScales({
        boundsWidth,
        boundsHeight,
        series: preparedSeries,
        xAxis,
        yAxis,
        split: preparedSplit,
    });
    const {shapes, shapesData} = useShapes({
        boundsWidth,
        boundsHeight,
        dispatcher,
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split: preparedSplit,
        htmlLayout,
    });
    const boundsOffsetTop = chart.margin.top;
    // We only need to consider the width of the first left axis
    const boundsOffsetLeft = chart.margin.left + getYAxisWidth(yAxis[0]);

    return {
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        legendConfig,
        legendItems,
        preparedLegend,
        preparedSeries,
        preparedSplit,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        title,
        tooltip,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
