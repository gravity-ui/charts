import React from 'react';

import type {Dispatch} from 'd3';

import {
    useAxis,
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    useNormalizedOriginalData,
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
import {getZoomedSeriesData} from '../../utils';

import type {ChartInnerProps} from './types';
import {hasAtLeastOneSeriesDataPerPlot} from './utils';

type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    svgContainer: SVGGElement | null;
    updateZoomState: (nextZoomState: Partial<ZoomState>) => void;
    zoomState: Partial<ZoomState>;
};

export function useChartInnerProps(props: Props) {
    const {
        clipPathId,
        data,
        dispatcher,
        height,
        htmlLayout,
        plotNode,
        svgContainer,
        width,
        updateZoomState,
        zoomState,
    } = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const {normalizedSeriesData, normalizedXAxis, normalizedYAxis} = useNormalizedOriginalData({
        seriesData: data.series.data,
        xAxis: data.xAxis,
        yAxis: data.yAxis,
    });
    const {chart, title, colors} = useChartOptions({
        seriesData: normalizedSeriesData,
        chart: data.chart,
        colors: data.colors,
        title: data.title,
    });
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(data.series.options);
    }, [data.series.options]);
    const {
        preparedSeries: basePreparedSeries,
        preparedLegend,
        handleLegendItemClick,
    } = useSeries({
        colors,
        legend: data.legend,
        originalSeriesData: normalizedSeriesData,
        seriesData: normalizedSeriesData,
        seriesOptions: data.series.options,
    });

    const {preparedSeries, preparedShapesSeries} = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: basePreparedSeries,
            xAxis: normalizedXAxis,
            yAxis: normalizedYAxis,
            zoomState,
        });
    }, [basePreparedSeries, normalizedXAxis, normalizedYAxis, zoomState]);

    const {legendConfig, legendItems} = React.useMemo(() => {
        if (!preparedLegend) {
            return {legendConfig: undefined, legendItems: []};
        }

        return getLegendComponents({
            chartWidth: width,
            chartHeight: height,
            chartMargin: chart.margin,
            series: preparedSeries,
            preparedLegend,
        });
    }, [width, height, chart.margin, preparedSeries, preparedLegend]);

    const {xAxis, yAxis} = useAxis({
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
                updateZoomState(nextZoomState);
            }
        },
        [xAxis, yAxis, preparedSeries, updateZoomState],
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
        preparedLegend,
        preparedSeries,
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
