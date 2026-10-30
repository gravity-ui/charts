import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {isEqual} from 'es-toolkit/compat';

import {getPreparedRangeSlider} from '~core/axes/range-slider';
import {DEFAULT_AXIS_TYPE, DEFAULT_PALETTE} from '~core/constants';
import {getHorizontalAxisOffsets} from '~core/layout/chart-dimensions';
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
    getZoomedSeriesData,
    isBandScale,
} from '~core/utils';
import {isDataEqual} from '~core/utils/equal';
import {hasGradient} from '~core/utils/gradient';

import {getShapes, getVisibleSeries, useZoom} from '../../hooks';
import type {
    ChartScale,
    LegendItem,
    OnLegendItemClick,
    PreparedLegend,
    PreparedRangeSlider,
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
import type {ChartAxisType, ChartData, LegendConfig} from '../../types';
import {getInitialRangeSliderState} from '../utils';

import type {GradientReferenceCacheEntry} from './gradientReferenceCache';
import {isGradientReferenceCurrent} from './gradientReferenceCache';
import {prepareAxisLayout} from './prepareAxisLayout';
import {prepareGradientReference} from './prepareGradientReference';
import {reconcileLegendSelection} from './reconcileLegendSelection';
import type {ChartInnerProps} from './types';
import {getNormalizedXAxis, getNormalizedYAxis, getPreparedChart, getPreparedTitle} from './utils';
import {hasAtLeastOneSeriesDataPerPlot} from './utils/common';

interface Props extends Omit<ChartInnerProps, 'chartApi'> {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    updateRangeSliderState: (nextState?: RangeSliderState) => void;
    updateZoomState: (nextZoomState: Partial<ZoomState>) => void;
    zoomState: Partial<ZoomState>;
    rangeSliderState?: RangeSliderState;
}

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

const EMPTY_LAYER_INDEXES = new Map<string, number>();

interface RangeSliderConfig {
    axisType: ChartAxisType;
    defaultRange: PreparedRangeSlider['defaultRange'];
    enabled: boolean;
}

/**
 * Whether the range slider state of the previous data no longer applies. Zoom also copies its x
 * range into the state, so the state of a chart without a slider is kept while it stays disabled.
 */
function isRangeSliderChanged(previous: RangeSliderConfig | undefined, next: RangeSliderConfig) {
    return (
        !previous ||
        previous.axisType !== next.axisType ||
        previous.enabled !== next.enabled ||
        (next.enabled && previous.defaultRange !== next.defaultRange)
    );
}

type ChartState = {
    gradientReference?: GradientLayoutReference;
    allPreparedSeries: PreparedSeries[];
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    boundsWidth: number;
    layerIndexes: Map<string, number>;
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

    const selectedLegendItemsRef = React.useRef<string[] | null>(null);
    const [legendSelectionVersion, updateLegendSelectionVersion] = React.useReducer(
        (version: number) => version + 1,
        0,
    );
    const [chartState, setState] = React.useState<ChartState | null>(null);
    const prevStateValue = React.useRef(chartState);
    const previousChartData = React.useRef<ChartData | null>(null);
    const previousRangeSliderRef = React.useRef<RangeSliderConfig>();
    const rangeSliderInitPendingRef = React.useRef(false);
    const currentRunRef = React.useRef(0);
    const gradientReferenceRef = React.useRef<GradientReferenceCacheEntry>();
    const preparedRangeSlider = React.useMemo(
        () => getPreparedRangeSlider({xAxis: data.xAxis}),
        [data.xAxis],
    );
    React.useEffect(() => {
        currentRunRef.current++;
        const currentRun = currentRunRef.current;
        const selectedLegendItems = selectedLegendItemsRef.current;
        const rangeSlider: RangeSliderConfig = {
            axisType: data.xAxis?.type ?? DEFAULT_AXIS_TYPE,
            defaultRange: preparedRangeSlider.defaultRange,
            enabled: preparedRangeSlider.enabled,
        };
        const previousRangeSlider = previousRangeSliderRef.current;
        previousRangeSliderRef.current = rangeSlider;

        if (isRangeSliderChanged(previousRangeSlider, rangeSlider)) {
            // The slider is initialized from the x scale of the new data, once it is prepared
            // without the previous range.
            rangeSliderInitPendingRef.current = rangeSlider.enabled;

            if (rangeSliderState !== undefined) {
                updateRangeSliderState(undefined);
                return;
            }
        }

        (async function () {
            const chartDataChanged = !(
                previousChartData.current && isDataEqual(previousChartData.current, data)
            );

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

            const nextSelectedLegendItems =
                chartDataChanged && selectedLegendItems !== null
                    ? reconcileLegendSelection(
                          selectedLegendItems,
                          prevStateValue.current?.allPreparedSeries ?? [],
                          allPreparedSeries,
                      )
                    : selectedLegendItems;
            const enabledLegendItems = new Set(getAllLegendItems(allPreparedSeries));
            const nextActiveLegendItems =
                nextSelectedLegendItems?.filter((id) => enabledLegendItems.has(id)) ??
                getActiveLegendItems(allPreparedSeries);
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

            if (rangeSliderInitPendingRef.current && xScale && !isBandScale(xScale)) {
                // A superseded run must not consume the initialization requested by a newer one.
                if (currentRunRef.current !== currentRun) {
                    return;
                }

                rangeSliderInitPendingRef.current = false;
                const initialRangeSliderState = getInitialRangeSliderState({
                    defaultRange: preparedRangeSlider.defaultRange,
                    xScale,
                });

                if (!isEqual(initialRangeSliderState, rangeSliderState)) {
                    updateRangeSliderState(initialRangeSliderState);
                    return;
                }
            }

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

            const {shapes, shapesData, layerIndexes} = await getShapes({
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
            const boundsOffsetLeft =
                preparedChart.margin.left +
                getHorizontalAxisOffsets({preparedYAxis: yAxis, preparedLegend, legendConfig}).left;

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
                layerIndexes,
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
                selectedLegendItemsRef.current = nextSelectedLegendItems;
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
        legendSelectionVersion,
        zoomState,
        rangeSliderState,
        dispatcher,
        htmlLayout,
        preparedRangeSlider,
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
                selectedLegendItemsRef.current !== null &&
                activeLegendItems.length === 1 &&
                activeLegendItems.includes(id);
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

            currentRunRef.current++;
            // Keep disabled items' selection while clicks affect only the displayed legend.
            const selected = selectedLegendItemsRef.current;
            const disabledSelectedItems = preparedSeries
                .filter(
                    (series) =>
                        !series.legend.enabled &&
                        !allItems.includes(series.legend.groupId) &&
                        (selected ? selected.includes(series.legend.groupId) : series.visible),
                )
                .map((series) => series.legend.groupId);
            selectedLegendItemsRef.current = [
                ...new Set([...nextActiveLegendItems, ...disabledSelectedItems]),
            ];
            updateLegendSelectionVersion();
        },
        [preparedSeries, activeLegendItems],
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
        layerIndexes: chartState?.layerIndexes ?? EMPTY_LAYER_INDEXES,
        shapesReady: Boolean(chartState),
        handleLegendItemClick,
        preparedTitle: chartState?.preparedTitle,
        preparedChart: chartState?.preparedChart,
    };
}
