import React from 'react';

import type {Dispatch} from 'd3';

import type {PreparedAxis} from '../../hooks';
import {
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    usePrevious,
    useSeries,
    useShapes,
    useSplit,
} from '../../hooks';
import {getZoomedSeriesData} from '../../hooks/hooks-utils';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getPreparedXAxis} from '../../hooks/useChartOptions/x-axis';
import {getPreparedYAxis} from '../../hooks/useChartOptions/y-axis';
import {useZoom} from '../../hooks/useZoom';
import type {ZoomState} from '../../hooks/useZoom/types';

import type {ChartInnerProps} from './types';
import {hasAtLeastOneSeriesDataPerPlot} from './utils';

type Props = ChartInnerProps & {
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    svgContainer: SVGGElement | null;
    plotNode: SVGGElement | null;
};

export function useChartInnerProps(props: Props) {
    const {width, height, data, dispatcher, htmlLayout, svgContainer, plotNode} = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
    const {chart, title, tooltip, colors} = useChartOptions({data});

    const zoomedSeriesData = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: data.series.data,
            xAxis: data.xAxis,
            yAxises: data.yAxis,
            zoomState,
        });
    }, [data.series.data, data.xAxis, data.yAxis, zoomState]);

    const [xAxis, setXAxis] = React.useState<PreparedAxis | null>(null);
    React.useEffect(() => {
        getPreparedXAxis({xAxis: data.xAxis, width, seriesData: zoomedSeriesData}).then((val) =>
            setXAxis(val),
        );
    }, [data.xAxis, width, zoomedSeriesData]);

    const [yAxis, setYAxis] = React.useState<PreparedAxis[]>([]);
    React.useEffect(() => {
        getPreparedYAxis({yAxis: data.yAxis, height, seriesData: zoomedSeriesData}).then((val) =>
            setYAxis(val),
        );
    }, [data.yAxis, height, zoomedSeriesData]);

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
        colors,
        legend: data.legend,
        originalSeriesData: data.series.data,
        seriesData: zoomedSeriesData,
        seriesOptions: data.series.options,
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
        hasZoomX: Boolean(zoomState.x),
        hasZoomY: Boolean(zoomState.y),
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

    const handleAttemptToSetZoomState = React.useCallback(
        (nextZoomState: Partial<ZoomState>) => {
            const nextZoomedSeriesData = getZoomedSeriesData({
                seriesData: zoomedSeriesData,
                xAxis: data.xAxis,
                yAxises: data.yAxis,
                zoomState: nextZoomState,
            });

            const hasData = hasAtLeastOneSeriesDataPerPlot(nextZoomedSeriesData, yAxis);

            if (hasData) {
                setZoomState(nextZoomState);
            }
        },
        [data.xAxis, data.yAxis, yAxis, zoomedSeriesData],
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

    const {x, bottom} = svgContainer?.getBoundingClientRect() ?? {};

    const handleZoomReset = React.useCallback(() => {
        setZoomState({});
    }, []);

    return {
        svgBottomPos: bottom,
        svgXPos: x,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        handleZoomReset: Object.keys(zoomState).length > 0 ? handleZoomReset : undefined,
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
