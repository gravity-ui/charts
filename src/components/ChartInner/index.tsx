import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import {Button, ButtonIcon, useUniqId} from '@gravity-ui/uikit';
import isEqual from 'lodash/isEqual';

import {getPreparedRangeSlider} from '~core/axes/range-slider';
import {EventType, getDispatcher, isBandScale} from '~core/utils';

import {useCrosshair, usePrevious} from '../../hooks';
import type {RangeSliderState, ZoomState} from '../../hooks';
import {getClipPathIdByBounds} from '../../hooks/useShapes/utils';
import {block} from '../../utils';
import {AxisX} from '../AxisX/AxisX';
import {prepareXAxisData} from '../AxisX/prepare-axis-data';
import type {AxisXData} from '../AxisX/types';
import {AxisY} from '../AxisY/AxisY';
import {prepareYAxisData} from '../AxisY/prepare-axis-data';
import type {AxisYData} from '../AxisY/types';
import {Legend} from '../Legend';
import {PlotTitle} from '../PlotTitle';
import {RangeSlider} from '../RangeSlider';
import {Title} from '../Title';
import {Tooltip} from '../Tooltip';
import {getInitialRangeSliderState} from '../utils';

import type {ChartInnerProps} from './types';
import {useChartInnerHandlers} from './useChartInnerHandlers';
import {useChartInnerProps} from './useChartInnerProps';
import {useChartInnerState} from './useChartInnerState';
import {useDefaultState} from './useDefaultState';
import {
    getPreparedTooltip,
    getResetZoomButtonStyle,
    useAsyncState,
    useDebouncedValue,
} from './utils';

import './styles.scss';

const b = block('chart');

const DEBOUNCED_VALUE_DELAY = 10;

export const ChartInner = (props: ChartInnerProps) => {
    const {width, height, data, onReady} = props;
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const resetZoomButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const [htmlLayout, setHtmlLayout] = React.useState<HTMLDivElement | null>(null);
    const plotRef = React.useRef<SVGGElement | null>(null);
    const plotBeforeRef = React.useRef<SVGGElement | null>(null);
    const plotAfterRef = React.useRef<SVGGElement | null>(null);
    const dispatcher = React.useMemo(() => getDispatcher(), []);
    const clipPathId = useUniqId();

    const preparedTooltip = React.useMemo(() => {
        return getPreparedTooltip({
            tooltip: data.tooltip,
            seriesData: data.series.data,
            yAxes: data.yAxis,
            xAxis: data.xAxis,
        });
    }, [data.series.data, data.tooltip, data.yAxis, data.xAxis]);
    const preparedRangeSlider = React.useMemo(() => {
        return getPreparedRangeSlider({xAxis: data.xAxis});
    }, [data.xAxis]);
    const {
        initialized,
        setInitialized,
        tooltipPinned,
        togglePinTooltip,
        unpinTooltip,
        updateZoomState,
        zoomState,
    } = useChartInnerState({
        dispatcher,
        preparedRangeSlider,
        tooltip: preparedTooltip,
    });
    // Snapshot of zoomState that the chart returns to on reset. Captures the slider's
    // initial range (when defaultRange is set) so reset doesn't drop us to {} and
    // wipe the user's intended starting view.
    const initialZoomRef = React.useRef<Partial<ZoomState>>({});
    const handleRangeSliderUpdate = React.useCallback(
        (state?: RangeSliderState) => {
            updateZoomState(state ? {x: [state.min, state.max]} : {});
        },
        [updateZoomState],
    );
    const {
        activeLegendItems,
        allPreparedSeries,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        legendConfig,
        legendItems,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        preparedSplit,
        shapes,
        shapesData,
        shapesReady,
        xAxis,
        xScale,
        yAxis,
        yScale,
        preparedTitle,
        preparedChart,
    } = useChartInnerProps({
        ...props,
        clipPathId,
        dispatcher,
        htmlLayout,
        plotNode: plotRef.current,
        updateZoomState,
        zoomState,
    });
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const debouncedBoundsWidth = useDebouncedValue({
        value: boundsWidth,
        delay: DEBOUNCED_VALUE_DELAY,
    });
    const debouncedOffsetLeft = useDebouncedValue({
        value: boundsOffsetLeft,
        delay: DEBOUNCED_VALUE_DELAY,
    });
    const debouncedAllPreparedSeries = useDebouncedValue({
        value: allPreparedSeries,
        delay: DEBOUNCED_VALUE_DELAY,
    });
    const {
        handleChartClick,
        handlePointerLeave,
        throttledHandlePointerMove,
        throttledHandleTouchMove,
    } = useChartInnerHandlers({
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        dispatcher,
        shapesData,
        svgContainer: svgRef.current,
        togglePinTooltip,
        tooltipPinned,
        unpinTooltip,
        xAxis,
        yAxis,
        xScale,
        yScale,
        tooltipThrottle: preparedTooltip.throttle,
    });
    useDefaultState({
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        defaultState: data.defaultState,
        dispatcher,
        shapesData,
        shapesReady,
        svgRef,
        xAxis,
        yAxis,
        xScale,
        yScale,
    });
    const clickHandler = data.chart?.events?.click;
    const pointerMoveHandler = data.chart?.events?.pointermove;
    const prevRangeSliderDefaultRange = usePrevious(preparedRangeSlider.defaultRange);

    useCrosshair({
        split: preparedSplit,
        plotElement: plotAfterRef.current,
        boundsOffsetLeft,
        boundsOffsetTop,
        width: boundsWidth,
        height: boundsHeight,
        xAxis,
        yAxes: yAxis,
        yScale,
        xScale,
        dispatcher,
    });

    React.useEffect(() => {
        if (clickHandler) {
            dispatcher.on(EventType.CLICK_CHART, clickHandler);
        }

        if (pointerMoveHandler) {
            dispatcher.on(EventType.POINTERMOVE_CHART, (...args) => {
                const [handlerData, event] = args;
                pointerMoveHandler(handlerData, event);
            });
        }

        return () => {
            dispatcher.on(EventType.CLICK_CHART, null);
            dispatcher.on(EventType.POINTERMOVE_CHART, null);
        };
    }, [dispatcher, clickHandler, pointerMoveHandler]);

    React.useEffect(() => {
        if ((prevWidth !== width || prevHeight !== height) && tooltipPinned) {
            unpinTooltip?.();
        }
    }, [prevWidth, width, prevHeight, height, tooltipPinned, unpinTooltip]);

    const setYAxisDataItems = React.useCallback(async () => {
        const items: AxisYData[] = [];
        for (let i = 0; i < yAxis.length; i++) {
            const axis = yAxis[i];
            const scale = yScale?.[i];
            if (scale) {
                const axisData = await prepareYAxisData({
                    axis,
                    scale,
                    top: boundsOffsetTop,
                    width: boundsWidth,
                    height: boundsHeight,
                    split: preparedSplit,
                    series: preparedSeries.filter((s) => s.visible),
                });
                axisData.plotShapes.forEach((shapeData, j) => {
                    if (axis.plotShapes[j]) {
                        axis.plotShapes[j].hitbox = shapeData.hitbox;
                        axis.plotShapes[j].x = shapeData.x;
                        axis.plotShapes[j].y = shapeData.y;
                    }
                });
                items.push(axisData);
            }
        }
        return items;
    }, [boundsHeight, boundsOffsetTop, boundsWidth, preparedSeries, preparedSplit, yAxis, yScale]);
    // Gate axis data computation until the legend has been computed at least once.
    // Using legendConfig (undefined → value, never reverts) avoids false→true toggling
    // on every zoom/range-slider interaction that would otherwise stall axis rendering.
    const axisDataReady = !preparedLegend?.enabled || Boolean(legendConfig);
    const yAxisDataItems = useAsyncState<AxisYData[]>([], setYAxisDataItems, axisDataReady);

    const setXAxisDataItems = React.useCallback(async () => {
        const items: AxisXData[] = [];
        const axis = xAxis;
        const scale = xScale;
        if (axis && scale) {
            const axisData = await prepareXAxisData({
                axis,
                boundsOffsetLeft: boundsOffsetLeft,
                boundsOffsetRight: width - boundsWidth - boundsOffsetLeft,
                boundsWidth,
                chartMarginLeft: preparedChart?.margin.left ?? 0,
                chartMarginRight: preparedChart?.margin.right ?? 0,
                height: boundsHeight,
                scale,
                series: preparedSeries.filter((s) => s.visible),
                split: preparedSplit,
                yAxis,
            });
            axisData.forEach((data) => {
                data.plotShapes.forEach((shapeData, i) => {
                    if (axis.plotShapes[i]) {
                        axis.plotShapes[i].hitbox = shapeData.hitbox;
                        axis.plotShapes[i].x = shapeData.x;
                        axis.plotShapes[i].y = shapeData.y;
                    }
                });
            });
            items.push(...axisData);
        }
        return items;
    }, [
        boundsHeight,
        boundsOffsetLeft,
        boundsWidth,
        preparedChart,
        preparedSeries,
        preparedSplit,
        width,
        xAxis,
        xScale,
        yAxis,
    ]);
    const xAxisDataItems = useAsyncState<AxisXData[]>([], setXAxisDataItems, axisDataReady);

    React.useEffect(() => {
        if (!initialized && xScale) {
            if (!preparedRangeSlider.enabled || isBandScale(xScale)) {
                setInitialized(true);
                return;
            }

            const initialRangeSliderState = getInitialRangeSliderState({
                defaultRange: preparedRangeSlider.defaultRange,
                xScale,
            });
            const initialZoom: Partial<ZoomState> = {
                x: [initialRangeSliderState.min, initialRangeSliderState.max],
            };

            initialZoomRef.current = initialZoom;
            updateZoomState(initialZoom);
            setInitialized(true);
        } else if (preparedRangeSlider.defaultRange !== prevRangeSliderDefaultRange && xScale) {
            if (!preparedRangeSlider.enabled || isBandScale(xScale)) {
                return;
            }

            const initialRangeSliderState = getInitialRangeSliderState({
                defaultRange: preparedRangeSlider.defaultRange,
                xScale,
            });
            const initialZoom: Partial<ZoomState> = {
                x: [initialRangeSliderState.min, initialRangeSliderState.max],
            };

            initialZoomRef.current = initialZoom;
            updateZoomState(initialZoom);
        }
    }, [
        initialized,
        preparedRangeSlider.defaultRange,
        preparedRangeSlider.enabled,
        prevRangeSliderDefaultRange,
        setInitialized,
        updateZoomState,
        xScale,
    ]);

    React.useEffect(() => {
        if (shapesReady) {
            onReady?.({dimensions: {width, height}});
        }
    }, [height, shapesReady, onReady, width]);

    const chartContent = (
        <React.Fragment>
            <defs>
                <clipPath id={getClipPathIdByBounds({clipPathId})}>
                    <rect x={0} y={0} width={boundsWidth} height={boundsHeight} />
                </clipPath>
                <clipPath id={getClipPathIdByBounds({clipPathId, bounds: 'horizontal'})}>
                    <rect x={0} y={-boundsHeight} width={boundsWidth} height={boundsHeight * 3} />
                </clipPath>
            </defs>
            {preparedTitle && <Title {...preparedTitle} htmlLayout={htmlLayout} />}
            <g transform={`translate(0, ${boundsOffsetTop})`}>
                {preparedSplit?.plots.map((plot, index) => {
                    return <PlotTitle key={`plot-${index}`} title={plot.title} />;
                })}
            </g>
            <g
                className={b('content')}
                width={boundsWidth}
                height={boundsHeight}
                transform={`translate(${[boundsOffsetLeft, boundsOffsetTop].join(',')})`}
                ref={plotRef}
            >
                {Boolean(xScale && xAxisDataItems.length) && (
                    <React.Fragment>
                        {xAxisDataItems.map((axisData) => {
                            return (
                                <AxisX
                                    key={axisData.id}
                                    htmlLayout={htmlLayout}
                                    plotAfterRef={plotAfterRef}
                                    plotBeforeRef={plotBeforeRef}
                                    preparedAxisData={axisData}
                                />
                            );
                        })}
                    </React.Fragment>
                )}
                {Boolean(yAxisDataItems.length) && (
                    <React.Fragment>
                        {yAxisDataItems.map((axisData, index) => {
                            if (!axisData) {
                                return null;
                            }

                            return (
                                <AxisY
                                    key={index}
                                    htmlLayout={htmlLayout}
                                    plotAfterRef={plotAfterRef}
                                    plotBeforeRef={plotBeforeRef}
                                    preparedAxisData={axisData}
                                />
                            );
                        })}
                    </React.Fragment>
                )}
                <g ref={plotBeforeRef} />
                {shapes}
                <g ref={plotAfterRef} />
            </g>
            {xAxis?.rangeSlider?.enabled &&
                preparedChart &&
                preparedLegend &&
                debouncedAllPreparedSeries &&
                preparedSeriesOptions && (
                    <RangeSlider
                        activeLegendItems={activeLegendItems ?? []}
                        boundsOffsetLeft={debouncedOffsetLeft}
                        boundsWidth={debouncedBoundsWidth}
                        height={height}
                        htmlLayout={htmlLayout}
                        onUpdate={handleRangeSliderUpdate}
                        preparedChart={preparedChart}
                        preparedLegend={preparedLegend}
                        preparedSeries={debouncedAllPreparedSeries}
                        preparedSeriesOptions={preparedSeriesOptions}
                        preparedRangeSlider={xAxis.rangeSlider}
                        range={zoomState.x}
                        width={width}
                        xAxis={data.xAxis}
                        yAxis={data.yAxis}
                        legendConfig={legendConfig}
                    />
                )}
            {preparedLegend?.enabled && legendConfig && (
                <Legend
                    chartSeries={preparedSeries}
                    legend={preparedLegend}
                    items={legendItems}
                    config={legendConfig}
                    onItemClick={handleLegendItemClick}
                    onUpdate={unpinTooltip}
                    htmlLayout={htmlLayout}
                />
            )}
        </React.Fragment>
    );

    return (
        <div className={b()}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                // We use onPointerMove here because onMouseMove works incorrectly when the zoom setting is enabled:
                // when starting to select an area, the tooltip remains in the position where the selection began
                onPointerMove={throttledHandlePointerMove}
                onPointerLeave={handlePointerLeave}
                onTouchStart={throttledHandleTouchMove}
                onTouchMove={throttledHandleTouchMove}
                onClick={handleChartClick}
            >
                {initialized ? chartContent : null}
            </svg>
            <div
                className={b('html-layer')}
                ref={setHtmlLayout}
                style={
                    {
                        '--g-html-layout-plot-transform': `translate(${boundsOffsetLeft}px, ${boundsOffsetTop}px)`,
                    } as React.CSSProperties
                }
            />
            {!isEqual(zoomState, initialZoomRef.current) && preparedChart?.zoom && (
                <Button
                    className={b('reset-zoom-button')}
                    onClick={() => {
                        updateZoomState(initialZoomRef.current);
                    }}
                    ref={resetZoomButtonRef}
                    style={getResetZoomButtonStyle({
                        boundsHeight,
                        boundsOffsetLeft,
                        boundsOffsetTop,
                        boundsWidth,
                        node: resetZoomButtonRef.current,
                        titleHeight: preparedTitle?.height,
                        ...preparedChart.zoom.resetButton,
                    })}
                >
                    <ButtonIcon>
                        <ArrowRotateLeft />
                    </ButtonIcon>
                </Button>
            )}
            <Tooltip
                dispatcher={dispatcher}
                tooltip={preparedTooltip}
                svgContainer={svgRef.current}
                xAxis={xAxis}
                yAxis={yAxis[0]}
                onOutsideClick={unpinTooltip}
                tooltipPinned={tooltipPinned}
            />
        </div>
    );
};
