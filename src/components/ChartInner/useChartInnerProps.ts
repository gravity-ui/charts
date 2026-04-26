import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import {DEFAULT_PALETTE, SERIES_TYPE} from '~core/constants';
import {getLegendComponents, getPreparedLegend} from '~core/series/prepare-legend';
import {getPreparedOptions} from '~core/series/prepare-options';
import {getActiveLegendItems, getAllLegendItems} from '~core/series/utils';
import {
    getChartDimensions,
    getSortedSeriesData,
    getYAxisWidth,
    getZoomedSeriesData,
    isAxisRelatedSeries,
} from '~core/utils';

import {
    createScales,
    getAxes,
    getPreparedSeries,
    getShapes,
    getSplit,
    getVisibleSeries,
    useZoom,
} from '../../hooks';
import type {
    ChartScale,
    ClipPathBySeriesType,
    LegendItem,
    OnLegendItemClick,
    PreparedLegend,
    PreparedSeries,
    PreparedSeriesOptions,
    PreparedSplit,
    PreparedXAxis,
    PreparedYAxis,
    ShapeData,
    ZoomState,
} from '../../hooks';
import type {PreparedChart, PreparedTitle} from '../../hooks/types';
import type {ChartData, LegendConfig} from '../../types';

import type {ChartInnerProps} from './types';
import {
    getNormalizedXAxis,
    getNormalizedYAxis,
    getPreparedChart,
    getPreparedTitle,
    recalculateYAxisLabelsWidth,
} from './utils';
import {hasAtLeastOneSeriesDataPerPlot} from './utils/common';

type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    updateZoomState: (nextZoomState: Partial<ZoomState>) => void;
    zoomState: Partial<ZoomState>;
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
    yAxis: PreparedYAxis[];
    getYAxisWidth: (axis: PreparedYAxis) => number;
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

type ChartState = {
    allPreparedSeries: PreparedSeries[];
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    boundsWidth: number;
    legendConfig: LegendConfig;
    legendItems: LegendItem[][];
    preparedLegend: PreparedLegend;
    preparedSeries: PreparedSeries[];
    preparedSeriesOptions: PreparedSeriesOptions;
    preparedSplit: PreparedSplit;
    shapes: React.ReactElement[];
    shapesData: ShapeData[];
    xAxis: PreparedXAxis | null;
    xScale: ChartScale | undefined;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[] | undefined;
    activeLegendItems: string[];
    preparedChart: PreparedChart | undefined;
    preparedTitle: PreparedTitle | undefined;
};

export function useChartInnerProps(props: Props) {
    const {
        clipPathId,
        data,
        dispatcher,
        height,
        htmlLayout,
        plotNode,
        width,
        updateZoomState,
        zoomState,
    } = props;

    const [selectedLegendItems, setSelectedLegendItems] = React.useState<string[] | null>(null);
    const [chartState, setState] = React.useState<ChartState | null>(null);
    const prevStateValue = React.useRef(chartState);
    const previousChartData = React.useRef<ChartData | null>(null);
    const currentRunRef = React.useRef(0);
    React.useEffect(() => {
        currentRunRef.current++;
        const currentRun = currentRunRef.current;

        (async function () {
            const chartDataChanged = !(
                previousChartData.current && isEqual(previousChartData.current, data)
            );
            const axisTypeChanged =
                previousChartData.current?.xAxis?.type !== undefined &&
                previousChartData.current.xAxis.type !== data.xAxis?.type;

            if (axisTypeChanged && Object.keys(zoomState).length > 0) {
                updateZoomState({});
                return;
            }

            const preparedTitle = await getPreparedTitle({
                title: data.title,
                chartWidth: width,
                chartHeight: height,
                chartMargin: data.chart?.margin,
            });
            const preparedChart = getPreparedChart({
                chart: data.chart,
                seriesData: data.series.data,
                preparedTitle,
            });

            const colors = data.colors ?? DEFAULT_PALETTE;
            const normalizedSeriesData = getSortedSeriesData({
                seriesData: data.series.data,
                xAxis: data.xAxis,
                yAxis: data.yAxis,
            });
            const normalizedXAxis = getNormalizedXAxis({xAxis: data.xAxis});
            const normalizedYAxis = getNormalizedYAxis({yAxis: data.yAxis});
            const preparedSeriesOptions = getPreparedOptions(data.series.options);
            const preparedLegend = await getPreparedLegend({
                legend: data.legend,
                series: normalizedSeriesData,
            });

            let allPreparedSeries: PreparedSeries[];
            if (chartDataChanged) {
                allPreparedSeries = await getPreparedSeries({
                    seriesData: normalizedSeriesData,
                    seriesOptions: data.series.options,
                    preparedLegend,
                    colors,
                });
            } else {
                allPreparedSeries = prevStateValue.current?.allPreparedSeries ?? [];
            }

            const activeLegendItems =
                selectedLegendItems ?? getActiveLegendItems(allPreparedSeries);
            const visiblePreparedSeries = getVisibleSeries({
                preparedSeries: allPreparedSeries,
                activeLegendItems,
            });

            const preparedSeries = visiblePreparedSeries;

            const {legendConfig, legendItems} = await getLegendComponents({
                chartWidth: width,
                chartHeight: height,
                chartMargin: preparedChart.margin,
                series: preparedSeries,
                preparedLegend,
            });

            const axes = await getAxes({
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
            const xAxis = axes.xAxis;
            let yAxis = axes.yAxis;

            let preparedSplit: PreparedSplit = {plots: [], gap: 0};
            let xScale: ChartScale | undefined;
            let yScale: (ChartScale | undefined)[] | undefined;
            let boundsWidth = 0;
            let boundsHeight = 0;

            const calculateAxisBasedProps = async () => {
                const chartDimensions = getChartDimensions({
                    height,
                    margin: preparedChart.margin,
                    preparedLegend,
                    preparedSeries: preparedSeries,
                    preparedYAxis: yAxis,
                    preparedXAxis: xAxis,
                    width,
                    legendConfig,
                });
                boundsHeight = chartDimensions.boundsHeight;
                boundsWidth = chartDimensions.boundsWidth;

                preparedSplit = await getSplit({
                    split: data.split,
                    boundsHeight,
                    chartWidth: width,
                });

                if (preparedSeries.some(isAxisRelatedSeries)) {
                    ({xScale, yScale} = createScales({
                        boundsWidth,
                        boundsHeight,
                        isRangeSlider: false,
                        series: preparedSeries,
                        split: preparedSplit,
                        xAxis,
                        yAxis,
                        zoomState,
                    }));
                }
            };

            await calculateAxisBasedProps();
            const newYAxis = await recalculateYAxisLabelsWidth({
                seriesData: preparedSeries,
                yAxis,
                yScale,
                hasXZoom: Boolean(zoomState?.x),
            });
            if (!isEqual(yAxis, newYAxis)) {
                yAxis = newYAxis;
                await calculateAxisBasedProps();
            }

            const {shapes, shapesData} = await getShapes({
                boundsWidth,
                boundsHeight,
                clipPathBySeriesType: CLIP_PATH_BY_SERIES_TYPE,
                dispatcher,
                series: preparedSeries,
                seriesOptions: preparedSeriesOptions,
                xAxis,
                xScale,
                yAxis,
                yScale,
                split: preparedSplit,
                htmlLayout,
                clipPathId,
                isOutsideBounds: (x: number, y: number) => {
                    return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
                },
                zoomState,
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

            const newStateValue = {
                allPreparedSeries,
                boundsHeight,
                boundsOffsetLeft,
                boundsOffsetTop,
                boundsWidth,
                legendConfig,
                legendItems,
                preparedLegend,
                preparedSeries,
                preparedSeriesOptions,
                preparedSplit,
                shapes,
                shapesData,
                xAxis,
                xScale,
                yAxis,
                yScale,
                activeLegendItems,
                preparedChart,
                preparedTitle,
            };

            if (currentRunRef.current === currentRun) {
                if (!isEqual(prevStateValue.current, newStateValue)) {
                    setState(newStateValue);
                    prevStateValue.current = newStateValue;
                }
                previousChartData.current = data;
            }
        })();
    }, [
        height,
        width,
        data,
        selectedLegendItems,
        zoomState,
        dispatcher,
        htmlLayout,
        updateZoomState,
        clipPathId,
    ]);

    // additional start

    const preparedSeries = React.useMemo(
        () => chartState?.preparedSeries ?? [],
        [chartState?.preparedSeries],
    );
    const activeLegendItems = React.useMemo(
        () => chartState?.activeLegendItems ?? [],
        [chartState?.activeLegendItems],
    );
    const boundsHeight = chartState?.boundsHeight ?? 0;
    const boundsWidth = chartState?.boundsWidth ?? 0;

    const xAxis = chartState?.xAxis ?? null;
    const yAxis = React.useMemo(() => chartState?.yAxis ?? [], [chartState?.yAxis]);

    const handleLegendItemClick: OnLegendItemClick = React.useCallback(
        ({id, metaKey}) => {
            const allItems = getAllLegendItems(preparedSeries);
            const onlyItemSelected =
                (selectedLegendItems ?? []).length === 1 && activeLegendItems.includes(id);
            let nextActiveLegendItems: string[];

            if (metaKey && activeLegendItems.includes(id)) {
                nextActiveLegendItems = activeLegendItems.filter((item) => item !== id);
            } else if (metaKey && !activeLegendItems.includes(id)) {
                nextActiveLegendItems = activeLegendItems.concat(id);
            } else if (onlyItemSelected && allItems.length === 1) {
                nextActiveLegendItems = [];
            } else if (onlyItemSelected) {
                nextActiveLegendItems = allItems;
            } else {
                nextActiveLegendItems = [id];
            }

            setSelectedLegendItems(nextActiveLegendItems);
        },
        [preparedSeries, selectedLegendItems, activeLegendItems],
    );

    const handleAttemptToSetZoomState = React.useCallback(
        (nextZoomState: Partial<ZoomState>) => {
            const {preparedSeries: nextZoomedSeriesData} = getZoomedSeriesData({
                seriesData: chartState?.preparedSeries ?? [],
                xAxis,
                yAxis,
                zoomState: nextZoomState,
            });

            const hasData = hasAtLeastOneSeriesDataPerPlot(nextZoomedSeriesData, yAxis);

            if (hasData) {
                updateZoomState(nextZoomState);
            }
        },
        [chartState?.preparedSeries, updateZoomState, xAxis, yAxis],
    );

    useZoom({
        node: plotNode,
        onUpdate: handleAttemptToSetZoomState,
        plotContainerHeight: boundsHeight,
        plotContainerWidth: boundsWidth,
        preparedSplit: chartState?.preparedSplit,
        preparedZoom: chartState?.preparedChart?.zoom ?? null,
        xAxis,
        xScale: chartState?.xScale,
        yAxis,
        yScale: chartState?.yScale,
    });

    // additional end

    return {
        ...chartState,
        preparedSeries,
        boundsOffsetLeft: chartState?.boundsOffsetLeft ?? 0,
        boundsOffsetTop: chartState?.boundsOffsetTop ?? 0,
        boundsHeight,
        boundsWidth,
        xAxis,
        yAxis,
        shapesData: chartState?.shapesData ?? [],
        shapesReady: Boolean(chartState),
        handleLegendItemClick,
        preparedTitle: chartState?.preparedTitle,
        preparedChart: chartState?.preparedChart,
    };
}
