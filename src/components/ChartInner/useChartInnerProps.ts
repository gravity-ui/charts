import React from 'react';

import type {Dispatch} from 'd3';

import {
    useAxes,
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    usePrevious,
    useSeries,
    useShapes,
    useSplit,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import {getPreparedOptions} from '../../hooks/useSeries/prepare-options';
import {useZoom} from '../../hooks/useZoom';
import type {ZoomState} from '../../hooks/useZoom/types';
import {getSortedSeriesData, getZoomedSeriesData} from '../../utils';

import type {ChartInnerProps} from './types';
import {hasAtLeastOneSeriesDataPerPlot} from './utils';

type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    setZoomState: (zoomState: Partial<ZoomState>) => void;
    svgContainer: SVGGElement | null;
    zoomState: Partial<ZoomState>;
};

export function useChartInnerProps(props: Props) {
    const {
        width,
        height,
        data,
        dispatcher,
        htmlLayout,
        svgContainer,
        plotNode,
        clipPathId,
        setZoomState,
        zoomState,
    } = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const {chart, colors, rangeSlider, title} = useChartOptions({
        seriesData: data.series.data,
        chart: data.chart,
        colors: data.colors,
        rangeSlider: data.rangeSlider,
        title: data.title,
    });
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(data.series.options);
    }, [data.series.options]);
    const sortedSeriesData = React.useMemo(() => {
        return getSortedSeriesData({seriesData: data.series.data, yAxes: data.yAxis});
    }, [data.series.data, data.yAxis]);
    const {
        preparedSeries: allPreparedSeries,
        preparedLegend,
        handleLegendItemClick,
    } = useSeries({
        colors,
        legend: data.legend,
        originalSeriesData: sortedSeriesData,
        seriesData: sortedSeriesData,
        seriesOptions: data.series.options,
    });
    const {legendConfig, legendItems} = React.useMemo(() => {
        if (!preparedLegend) {
            return {legendConfig: undefined, legendItems: []};
        }

        return getLegendComponents({
            chartWidth: width,
            chartHeight: height,
            chartMargin: chart.margin,
            series: allPreparedSeries,
            preparedLegend,
        });
    }, [width, height, chart.margin, allPreparedSeries, preparedLegend]);

    const {preparedSeries, preparedShapesSeries} = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: allPreparedSeries,
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            zoomState,
        });
    }, [data.xAxis, data.yAxis, allPreparedSeries, zoomState]);

    const {xAxis, yAxis} = useAxes({
        height,
        preparedChart: chart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis: data.xAxis,
        yAxis: data.yAxis,
    });

    const {boundsWidth, boundsHeight} = useChartDimensions({
        height,
        margin: chart.margin,
        preparedLegend,
        preparedRangeSlider: rangeSlider,
        preparedSeries: preparedSeries,
        preparedYAxis: yAxis,
        preparedXAxis: xAxis,
        width,
    });
    const preparedSplit = useSplit({split: data.split, boundsHeight, chartWidth: width});
    const {xScale, yScale} = useAxisScales({
        boundsWidth,
        boundsHeight,
        hasZoomX: Boolean(zoomState.x),
        hasZoomY: Boolean(zoomState.y),
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        split: preparedSplit,
        xAxis,
        yAxis,
        zoomState,
    });

    const isOutsideBounds = React.useCallback(
        (x: number, y: number) => {
            return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
        },
        [boundsHeight, boundsWidth],
    );

    const {shapes, shapesData} = useShapes({
        boundsWidth,
        boundsHeight,
        dispatcher,
        series: preparedShapesSeries,
        seriesOptions: preparedSeriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split: preparedSplit,
        htmlLayout,
        clipPathId,
        isOutsideBounds,
    });

    const handleAttemptToSetZoomState = React.useCallback(
        (nextZoomState: Partial<ZoomState>) => {
            const {preparedSeries: nextZoomedSeriesData} = getZoomedSeriesData({
                seriesData: preparedSeries,
                xAxis,
                yAxis,
                zoomState: nextZoomState,
            });

            const hasData = hasAtLeastOneSeriesDataPerPlot(nextZoomedSeriesData, yAxis);

            if (hasData) {
                setZoomState(nextZoomState);
            }
        },
        [xAxis, yAxis, preparedSeries, setZoomState],
    );

    useZoom({
        node: plotNode,
        onUpdate: handleAttemptToSetZoomState,
        plotContainerHeight: boundsHeight,
        plotContainerWidth: boundsWidth,
        preparedSplit,
        preparedZoom: chart.zoom,
        xAxis,
        xScale,
        yAxis,
        yScale,
    });

    const boundsOffsetTop = chart.margin.top;
    // We need to calculate the width of each left axis because the first axis can be hidden
    const boundsOffsetLeft =
        chart.margin.left +
        yAxis.reduce((acc, axis) => {
            if (axis.position !== 'left') {
                return acc;
            }
            const axisWidth = getYAxisWidth(axis);
            if (acc < axisWidth) {
                acc = axisWidth;
            }
            return acc;
        }, 0);

    const {bottom, top, x} = svgContainer?.getBoundingClientRect() ?? {};

    return {
        allPreparedSeries,
        svgBottomPos: bottom,
        svgTopPos: top,
        svgXPos: x,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        isOutsideBounds,
        legendConfig,
        legendItems,
        preparedChart: chart,
        preparedLegend,
        preparedRangeSlider: rangeSlider,
        preparedSeries,
        preparedSeriesOptions,
        preparedSplit,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        title,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
