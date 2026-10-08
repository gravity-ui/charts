import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import {DEFAULT_PALETTE, SERIES_TYPE} from '~core/constants';
import {getPreparedSeries} from '~core/series';
import {finalizePreparedLegend, getPreparedLegend} from '~core/series/prepare-legend';
import {getPreparedOptions} from '~core/series/prepare-options';
import {getActiveLegendItems, getAllLegendItems} from '~core/series/utils';
import type {TooltipItemData} from '~core/shapes/types';
import {createIsOutsideBounds} from '~core/shapes/utils';
import {
    getEffectiveXRange,
    getOnlyVisibleSeries,
    getSortedSeriesData,
    getYAxisWidth,
    getZoomedSeriesData,
} from '~core/utils';
import {hasGradient} from '~core/utils/gradient';

import {getShapes, getVisibleSeries, useZoom} from '../../hooks';
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
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import type {PreparedChart, PreparedTitle} from '../../hooks/types';
import type {GradientLayoutReference} from '../../hooks/useShapes/types';
import type {ChartData, LegendConfig} from '../../types';

import type {GradientReferenceCacheEntry} from './gradientReferenceCache';
import {isGradientReferenceCurrent} from './gradientReferenceCache';
import {prepareAxisLayout} from './prepareAxisLayout';
import {prepareGradientReference} from './prepareGradientReference';
import type {ChartInnerProps} from './types';
import {getNormalizedXAxis, getNormalizedYAxis, getPreparedChart, getPreparedTitle} from './utils';
import {hasAtLeastOneSeriesDataPerPlot} from './utils/common';

type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    updateRangeSliderState: (nextState?: RangeSliderState) => void;
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
    gradientReference?: GradientLayoutReference;
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
    shapesData: TooltipItemData[];
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
        rangeSliderState,
        width,
        updateRangeSliderState,
        updateZoomState,
        zoomState,
    } = props;

    const [selectedLegendItems, setSelectedLegendItems] = React.useState<string[] | null>(null);
    const [chartState, setState] = React.useState<ChartState | null>(null);
    const prevStateValue = React.useRef(chartState);
    const previousChartData = React.useRef<ChartData | null>(null);
    const currentRunRef = React.useRef(0);
    const gradientReferenceRef = React.useRef<GradientReferenceCacheEntry>();
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

            if (axisTypeChanged && rangeSliderState !== undefined) {
                updateRangeSliderState(undefined);
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
            const legendOptions = await getPreparedLegend({
                legend: data.legend,
                series: normalizedSeriesData,
                chartWidth: width,
                chartMargin: preparedChart.margin,
            });

            let allPreparedSeries: PreparedSeries[];
            if (chartDataChanged) {
                allPreparedSeries = await getPreparedSeries({
                    seriesData: normalizedSeriesData,
                    seriesOptions: data.series.options,
                    preparedLegend: legendOptions,
                    colors,
                    xAxis: normalizedXAxis,
                    yAxis: normalizedYAxis,
                });
            } else {
                allPreparedSeries = prevStateValue.current?.allPreparedSeries ?? [];
            }

            const nextActiveLegendItems =
                selectedLegendItems ?? getActiveLegendItems(allPreparedSeries);
            const previousActiveLegendItems = prevStateValue.current?.activeLegendItems;
            const activeLegendItems =
                previousActiveLegendItems &&
                isEqual(previousActiveLegendItems, nextActiveLegendItems)
                    ? previousActiveLegendItems
                    : nextActiveLegendItems;
            const visiblePreparedSeries = getVisibleSeries({
                preparedSeries: allPreparedSeries,
                activeLegendItems,
            });

            const effectiveZoomState: Partial<ZoomState> = {};
            const effectiveX = getEffectiveXRange(zoomState.x, rangeSliderState);

            if (effectiveX !== undefined) {
                effectiveZoomState.x = effectiveX;
            }

            if (zoomState.y !== undefined) {
                effectiveZoomState.y = zoomState.y;
            }

            const {preparedSeries, preparedShapesSeries} = getZoomedSeriesData({
                seriesData: visiblePreparedSeries,
                xAxis: normalizedXAxis,
                yAxis: normalizedYAxis,
                zoomState: effectiveZoomState,
            });

            const {preparedLegend, legendConfig, legendItems} = await finalizePreparedLegend({
                chartWidth: width,
                chartHeight: height,
                chartMargin: preparedChart.margin,
                series: preparedSeries,
                preparedLegend: legendOptions,
            });

            const {
                xAxis,
                yAxis,
                split: preparedSplit,
                xScale,
                yScale,
                boundsWidth,
                boundsHeight,
            } = await prepareAxisLayout({
                height,
                preparedChart,
                legendConfig,
                preparedLegend,
                preparedSeries,
                preparedSeriesOptions,
                width,
                xAxis: normalizedXAxis,
                yAxis: normalizedYAxis,
                split: data.split,
                rangeSliderState,
                zoomState,
            });

            let gradientReference = gradientReferenceRef.current;
            const getGradientReference = async (): Promise<GradientLayoutReference> => {
                if (
                    !gradientReference ||
                    !isGradientReferenceCurrent(gradientReference, {
                        width,
                        height,
                        allPreparedSeries,
                        activeLegendItems,
                    })
                ) {
                    const reference = Object.keys(effectiveZoomState).length
                        ? await prepareGradientReference({
                              height,
                              width,
                              preparedChart,
                              legendConfig,
                              preparedLegend,
                              preparedSeries: visiblePreparedSeries,
                              preparedSeriesOptions,
                              xAxis: normalizedXAxis,
                              yAxis: normalizedYAxis,
                              split: data.split,
                          })
                        : {
                              boundsWidth,
                              boundsHeight,
                              series: visiblePreparedSeries,
                              xAxis,
                              yAxis,
                              split: preparedSplit,
                              xScale,
                              yScale,
                          };
                    gradientReference = {
                        width,
                        height,
                        allPreparedSeries,
                        activeLegendItems,
                        data: reference,
                    };
                }
                return gradientReference.data;
            };

            const {shapes, shapesData} = await getShapes({
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
                isOutsideBounds: createIsOutsideBounds({boundsWidth, boundsHeight}),
                zoomState: effectiveZoomState,
                getGradientReference,
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

            const hasVisibleGradient =
                getOnlyVisibleSeries(visiblePreparedSeries).some(hasGradient);
            const activeGradientReference = hasVisibleGradient
                ? await getGradientReference()
                : undefined;
            const newStateValue = {
                gradientReference: activeGradientReference,
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
                gradientReferenceRef.current = hasVisibleGradient ? gradientReference : undefined;
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
        rangeSliderState,
        dispatcher,
        htmlLayout,
        updateRangeSliderState,
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
        activeLegendItems,
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
