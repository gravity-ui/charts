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
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import {useZoom} from '../../hooks/useZoom';
import type {ZoomState} from '../../hooks/useZoom/types';

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
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
    const {chart, title, tooltip, colors} = useChartOptions({data});
    const {preparedSeries, preparedSeriesOptions, preparedLegend, handleLegendItemClick} =
        useSeries({
            colors,
            legend: data.legend,
            originalSeriesData: data.series.data,
            seriesData: data.series.data,
            seriesOptions: data.series.options,
        });
    const {preparedZoomedSeries, preparedShapeZoomedSeries} = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: preparedSeries,
            xAxis: data.xAxis,
            yAxes: data.yAxis,
            zoomState,
        });
    }, [data.xAxis, data.yAxis, preparedSeries, zoomState]);

    const [xAxis, setXAxis] = React.useState<PreparedAxis | null>(null);
    React.useEffect(() => {
        setXAxis(null);
        getPreparedXAxis({xAxis: data.xAxis, width, seriesData: preparedZoomedSeries}).then((val) =>
            setXAxis(val),
        );
    }, [data.xAxis, width, preparedZoomedSeries]);

    const [yAxis, setYAxis] = React.useState<PreparedAxis[]>([]);
    React.useEffect(() => {
        setYAxis([]);
        getPreparedYAxis({yAxis: data.yAxis, height, seriesData: preparedZoomedSeries}).then(
            (val) => setYAxis(val),
        );
    }, [data.yAxis, height, preparedZoomedSeries]);

    const {legendConfig, legendItems} = React.useMemo(() => {
        if (!preparedLegend) {
            return {legendConfig: undefined, legendItems: []};
        }

        return getLegendComponents({
            chartHeight: height,
            chartMargin: chart.margin,
            chartWidth: width,
            preparedLegend,
            preparedYAxis: yAxis,
            series: preparedZoomedSeries,
        });
    }, [height, chart.margin, width, preparedZoomedSeries, preparedLegend, yAxis]);
    const {boundsWidth, boundsHeight} = useChartDimensions({
        width,
        height,
        margin: chart.margin,
        preparedLegend,
        preparedXAxis: xAxis,
        preparedYAxis: yAxis,
        preparedSeries: preparedZoomedSeries,
    });
    const preparedSplit = useSplit({split: data.split, boundsHeight, chartWidth: width});
    const {xScale, yScale} = useAxisScales({
        boundsWidth,
        boundsHeight,
        hasZoomX: Boolean(zoomState.x),
        hasZoomY: Boolean(zoomState.y),
        series: preparedZoomedSeries,
        xAxis,
        yAxis,
        split: preparedSplit,
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
        series: preparedShapeZoomedSeries,
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
            const {preparedZoomedSeries: nextZoomedSeriesData} = getZoomedSeriesData({
                seriesData: preparedZoomedSeries,
                xAxis: data.xAxis,
                yAxes: data.yAxis,
                zoomState: nextZoomState,
            });

            const hasData = hasAtLeastOneSeriesDataPerPlot(nextZoomedSeriesData, yAxis);

            if (hasData) {
                setZoomState(nextZoomState);
            }
        },
        [data.xAxis, data.yAxis, yAxis, preparedZoomedSeries],
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
        isOutsideBounds,
        legendConfig,
        legendItems,
        preparedLegend,
        preparedSeries: preparedZoomedSeries,
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
