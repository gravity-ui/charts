import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import type {PreparedAxis} from '../../hooks';
import {
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    usePrevious,
    useSeries,
    useShapeSeries,
    useShapes,
    useSplit,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getPreparedXAxis} from '../../hooks/useChartOptions/x-axis';
import {getPreparedYAxis} from '../../hooks/useChartOptions/y-axis';
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import {getPreparedOptions} from '../../hooks/useSeries/prepare-options';
import {getActiveLegendItems} from '../../hooks/useSeries/utils';
import {useZoom} from '../../hooks/useZoom';
import type {ZoomState} from '../../hooks/useZoom/types';
import type {ChartSeries} from '../../types';
import {getSortedSeriesData, getZoomedSeriesData} from '../../utils';

import type {ChartInnerProps} from './types';
import {hasAtLeastOneSeriesDataPerPlot} from './utils';

type Props = ChartInnerProps & {
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    svgContainer: SVGGElement | null;
    plotNode: SVGGElement | null;
    clipPathId: string;
};

export function useChartInnerProps(props: Props) {
    const {width, height, data, dispatcher, htmlLayout, svgContainer, plotNode, clipPathId} = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const {chart, title, tooltip, colors} = useChartOptions({
        seriesData: data.series.data,
        chart: data.chart,
        colors: data.colors,
        title: data.title,
        tooltip: data.tooltip,
        xAxis: data.xAxis,
        yAxes: data.yAxis,
    });
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(data.series.options);
    }, [data.series.options]);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
    const sortedSeriesData = React.useMemo(() => {
        return getSortedSeriesData({seriesData: data.series.data, yAxes: data.yAxis});
    }, [data.series.data, data.yAxis]);
    const {zoomedSeriesData, zoomedShapesSeriesData} = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: sortedSeriesData,
            xAxis: data.xAxis,
            yAxes: data.yAxis,
            zoomState,
        });
    }, [data.xAxis, data.yAxis, sortedSeriesData, zoomState]);

    const {preparedSeries, preparedLegend, handleLegendItemClick} = useSeries({
        colors,
        legend: data.legend,
        originalSeriesData: sortedSeriesData,
        seriesData: zoomedSeriesData,
        seriesOptions: data.series.options,
    });

    // preparing the X and Y axes
    const [axesState, setValue] = React.useState<{
        xAxis: PreparedAxis | null;
        yAxis: PreparedAxis[];
    }>({xAxis: null, yAxis: []});
    const axesStateRunRef = React.useRef(0);
    const prevAxesStateValue = React.useRef(axesState);
    const axesStateReady = React.useRef(false);
    React.useEffect(() => {
        axesStateRunRef.current++;
        axesStateReady.current = false;

        (async function () {
            const currentRun = axesStateRunRef.current;
            const seriesData = preparedSeries.filter((s) => s.visible) as ChartSeries[];
            const xAxis = await getPreparedXAxis({
                xAxis: data.xAxis,
                width,
                seriesData,
                seriesOptions: preparedSeriesOptions,
            });

            let estimatedBoundsHeight = height;

            if (xAxis) {
                estimatedBoundsHeight =
                    height -
                    (xAxis.title.height +
                        xAxis.title.margin +
                        xAxis.labels.margin +
                        xAxis.labels.height +
                        (preparedLegend ? preparedLegend.height + preparedLegend.margin : 0) +
                        chart.margin.top +
                        chart.margin.bottom);
            }

            const yAxis = await getPreparedYAxis({
                height,
                boundsHeight: estimatedBoundsHeight,
                width,
                seriesData,
                yAxis: data.yAxis,
            });

            const newStateValue = {xAxis, yAxis};

            if (axesStateRunRef.current === currentRun) {
                if (!isEqual(prevAxesStateValue.current, newStateValue)) {
                    setValue(newStateValue);
                    prevAxesStateValue.current = newStateValue;
                }

                axesStateReady.current = true;
            }
        })();
    }, [
        chart.margin,
        data.xAxis,
        data.yAxis,
        height,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
    ]);
    const {xAxis, yAxis} = axesStateReady.current ? axesState : {xAxis: null, yAxis: []};

    const activeLegendItems = React.useMemo(
        () => getActiveLegendItems(preparedSeries),
        [preparedSeries],
    );
    const {preparedSeries: preparedShapesSeries} = useShapeSeries({
        colors,
        seriesData: zoomedShapesSeriesData,
        seriesOptions: data.series.options,
        activeLegendItems,
        preparedLegend,
    });
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
            const {zoomedSeriesData: nextZoomedSeriesData} = getZoomedSeriesData({
                seriesData: zoomedSeriesData,
                xAxis: data.xAxis,
                yAxes: data.yAxis,
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

    const {bottom, top, x} = svgContainer?.getBoundingClientRect() ?? {};

    const handleZoomReset = React.useCallback(() => {
        setZoomState({});
    }, []);

    return {
        svgBottomPos: bottom,
        svgTopPos: top,
        svgXPos: x,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        handleZoomReset: Object.keys(zoomState).length > 0 ? handleZoomReset : undefined,
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
        tooltip,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
