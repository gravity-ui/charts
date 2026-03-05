import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import {DEFAULT_PALETTE, SERIES_TYPE} from '../../constants';
import {
    useAxis,
    useAxisScales,
    useChartDimensions,
    useNormalizedOriginalData,
    usePrevious,
    useSeries,
    useShapes,
    useSplit,
    useYAxisLabelWidth,
    useZoom,
} from '../../hooks';
import type {
    ClipPathBySeriesType,
    LegendItem,
    PreparedAxis,
    PreparedChart,
    PreparedLegend,
    PreparedSeries,
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import {getPreparedOptions} from '../../hooks/useSeries/prepare-options';
import type {LegendConfig} from '../../types';
import {getEffectiveXRange, getZoomedSeriesData} from '../../utils';

import type {ChartInnerProps} from './types';
import {hasAtLeastOneSeriesDataPerPlot} from './utils';

type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    preparedChart: PreparedChart;
    updateZoomState: (nextZoomState: Partial<ZoomState>) => void;
    zoomState: Partial<ZoomState>;
    rangeSliderState?: RangeSliderState;
};

const CLIP_PATH_BY_SERIES_TYPE: ClipPathBySeriesType = {
    [SERIES_TYPE.Scatter]: false,
};

function getBoundsOffsetTop({
    chartMarginTop,
    preparedLegend,
    legendConfig,
}: {
    chartMarginTop: number;
    preparedLegend: PreparedLegend | null;
    legendConfig: LegendConfig | undefined;
}): number {
    return (
        chartMarginTop +
        (preparedLegend?.enabled && preparedLegend.position === 'top'
            ? (legendConfig?.height ?? 0) + preparedLegend.margin
            : 0)
    );
}

function getBoundsOffsetLeft(args: {
    chartMarginLeft: number;
    preparedLegend: PreparedLegend | null;
    yAxis: PreparedAxis[];
    getYAxisWidth: (axis: PreparedAxis) => number;
    legendConfig: LegendConfig | undefined;
}): number {
    const {
        chartMarginLeft,
        preparedLegend,
        yAxis,
        getYAxisWidth: getAxisWidth,
        legendConfig,
    } = args;

    const legendOffset =
        preparedLegend?.enabled && preparedLegend.position === 'left'
            ? (legendConfig?.width ?? 0) + preparedLegend.margin
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

type LegendState = {
    legendConfig?: LegendConfig;
    legendItems: LegendItem[][];
};

export function useLegend({
    preparedLegend,
    preparedChart,
    preparedSeries,
    width,
    height,
}: {
    preparedLegend: PreparedLegend | null;
    preparedChart: PreparedChart;
    preparedSeries: PreparedSeries[];
    width: number;
    height: number;
}) {
    const [legendState, setLegend] = React.useState<LegendState>({
        legendConfig: undefined,
        legendItems: [],
    });
    const legendStateRunRef = React.useRef(0);
    const prevLegendStateValue = React.useRef(legendState);
    const legendStateReady = React.useRef(false);

    React.useEffect(() => {
        legendStateRunRef.current++;
        legendStateReady.current = false;

        (async function () {
            const currentRun = legendStateRunRef.current;
            if (!preparedLegend) {
                return;
            }

            const newStateValue = await getLegendComponents({
                chartWidth: width,
                chartHeight: height,
                chartMargin: preparedChart.margin,
                series: preparedSeries,
                preparedLegend,
            });

            if (legendStateRunRef.current === currentRun) {
                if (!isEqual(prevLegendStateValue.current, newStateValue)) {
                    setLegend(newStateValue);
                    prevLegendStateValue.current = newStateValue;
                }

                legendStateReady.current = true;
            }
        })();
    }, [height, preparedChart.margin, preparedLegend, preparedSeries, width]);

    return legendStateReady.current
        ? legendState
        : {
              legendConfig: undefined,
              legendItems: [],
          };
}

export function useChartInnerProps(props: Props) {
    const {
        clipPathId,
        data,
        dispatcher,
        height,
        htmlLayout,
        plotNode,
        preparedChart,
        rangeSliderState,
        width,
        updateZoomState,
        zoomState,
    } = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const colors = React.useMemo(() => {
        return data.colors ?? DEFAULT_PALETTE;
    }, [data.colors]);
    const {normalizedSeriesData, normalizedXAxis, normalizedYAxis} = useNormalizedOriginalData({
        seriesData: data.series.data,
        xAxis: data.xAxis,
        yAxis: data.yAxis,
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

    const effectiveZoomState = React.useMemo((): Partial<ZoomState> => {
        const result: Partial<ZoomState> = {};
        const effectiveX = getEffectiveXRange(zoomState.x, rangeSliderState);

        if (effectiveX !== undefined) {
            result.x = effectiveX;
        }

        if (zoomState.y !== undefined) {
            result.y = zoomState.y;
        }

        return result;
    }, [zoomState, rangeSliderState]);

    const {preparedSeries, preparedShapesSeries} = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: allPreparedSeries,
            xAxis: normalizedXAxis,
            yAxis: normalizedYAxis,
            zoomState: effectiveZoomState,
        });
    }, [allPreparedSeries, normalizedXAxis, normalizedYAxis, effectiveZoomState]);

    const {legendConfig, legendItems} = useLegend({
        width,
        height,
        preparedChart,
        preparedSeries,
        preparedLegend,
    });

    const {xAxis, yAxis, setAxes} = useAxis({
        height,
        preparedChart,
        legendConfig,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis: normalizedXAxis,
        yAxis: normalizedYAxis,
    });

    const {boundsWidth, boundsHeight} = useChartDimensions({
        height,
        margin: preparedChart.margin,
        preparedLegend,
        preparedSeries: preparedSeries,
        preparedYAxis: yAxis,
        preparedXAxis: xAxis,
        width,
        legendConfig,
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

    useYAxisLabelWidth({seriesData: preparedSeries, setAxes, yAxis, yScale});

    const isOutsideBounds = React.useCallback(
        (x: number, y: number) => {
            return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
        },
        [boundsHeight, boundsWidth],
    );

    const {shapes, shapesData, shapesReady} = useShapes({
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
        zoomState: effectiveZoomState,
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
        preparedZoom: preparedChart.zoom,
        xAxis,
        xScale,
        yAxis,
        yScale,
    });

    const boundsOffsetTop = getBoundsOffsetTop({
        chartMarginTop: preparedChart.margin.top,
        preparedLegend,
        legendConfig,
    });

    // We need to calculate the width of each left axis because the first axis can be hidden
    const boundsOffsetLeft = getBoundsOffsetLeft({
        chartMarginLeft: preparedChart.margin.left,
        preparedLegend,
        yAxis,
        getYAxisWidth,
        legendConfig,
    });

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
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        preparedSplit,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        shapesReady,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
