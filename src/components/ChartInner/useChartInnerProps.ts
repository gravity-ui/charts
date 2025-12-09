import React from 'react';

import type {Dispatch} from 'd3';

import {SERIES_TYPE} from '../../constants';
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
    useZoom,
} from '../../hooks';
import type {
    ClipPathBySeriesType,
    PreparedAxis,
    PreparedLegend,
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import {getPreparedOptions} from '../../hooks/useSeries/prepare-options';
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
    rangeSliderState?: RangeSliderState;
};

const CLIP_PATH_BY_SERIES_TYPE: ClipPathBySeriesType = {
    [SERIES_TYPE.Scatter]: false,
};

function getBoundsOffsetTop(args: {
    chartMarginTop: number;
    preparedLegend: PreparedLegend | null;
}): number {
    const {chartMarginTop, preparedLegend} = args;

    return (
        chartMarginTop +
        (preparedLegend?.enabled && preparedLegend.position === 'top'
            ? preparedLegend.height + preparedLegend.margin
            : 0)
    );
}

function getBoundsOffsetLeft(args: {
    chartMarginLeft: number;
    preparedLegend: PreparedLegend | null;
    yAxis: PreparedAxis[];
    getYAxisWidth: (axis: PreparedAxis) => number;
}): number {
    const {chartMarginLeft, preparedLegend, yAxis, getYAxisWidth: getAxisWidth} = args;

    const legendOffset =
        preparedLegend?.enabled && preparedLegend.position === 'left'
            ? preparedLegend.width + preparedLegend.margin
            : 0;

    const leftAxisWidth = yAxis.reduce((acc, axis) => {
        if (axis.position !== 'left') {
            return acc;
        }
        const axisWidth = getAxisWidth(axis);
        if (acc < axisWidth) {
            acc = axisWidth;
        }
        return acc;
    }, 0);

    return chartMarginLeft + legendOffset + leftAxisWidth;
}

export function useChartInnerProps(props: Props) {
    const {
        clipPathId,
        data,
        dispatcher,
        height,
        htmlLayout,
        plotNode,
        rangeSliderState,
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
    const {chart, colors, title} = useChartOptions({
        chart: data.chart,
        colors: data.colors,
        seriesData: normalizedSeriesData,
        title: data.title,
        xAxis: data.xAxis,
    });
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(data.series.options);
    }, [data.series.options]);
    const {
        preparedSeries: allPreparedSeries,
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
            seriesData: allPreparedSeries,
            xAxis: normalizedXAxis,
            yAxis: normalizedYAxis,
            zoomState,
        });
    }, [allPreparedSeries, normalizedXAxis, normalizedYAxis, zoomState]);

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
        xAxis: normalizedXAxis,
        yAxis: normalizedYAxis,
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
        rangeSliderState,
        series: preparedSeries,
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
        clipPathBySeriesType: CLIP_PATH_BY_SERIES_TYPE,
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

    const boundsOffsetTop = getBoundsOffsetTop({
        chartMarginTop: chart.margin.top,
        preparedLegend,
    });

    // We need to calculate the width of each left axis because the first axis can be hidden
    const boundsOffsetLeft = getBoundsOffsetLeft({
        chartMarginLeft: chart.margin.left,
        preparedLegend,
        yAxis,
        getYAxisWidth,
    });

    const {x} = svgContainer?.getBoundingClientRect() ?? {};

    return {
        allPreparedSeries,
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
        preparedSeries,
        preparedSeriesOptions,
        preparedSplit,
        preparedZoom: chart.zoom,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        svgXPos: x,
        title,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
