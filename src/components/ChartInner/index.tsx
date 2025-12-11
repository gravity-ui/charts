import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import {Button, ButtonIcon, useUniqId} from '@gravity-ui/uikit';

import {useCrosshair} from '../../hooks';
import {getPreparedRangeSlider} from '../../hooks/useAxis/range-slider';
import {getPreparedChart} from '../../hooks/useChartOptions/chart';
import {getPreparedTitle} from '../../hooks/useChartOptions/title';
import {getPreparedTooltip} from '../../hooks/useChartOptions/tooltip';
import {EventType, block, getDispatcher, isBandScale} from '../../utils';
import {AxisX} from '../AxisX/AxisX';
import {prepareXAxisData} from '../AxisX/prepare-axis-data';
import type {AxisXData} from '../AxisX/types';
import {AxisY} from '../AxisY/AxisY';
import {prepareYAxisData} from '../AxisY/prepare-axis-data';
import type {AxisYData} from '../AxisY/types';
import {Legend} from '../Legend';
import {PlotTitle} from '../PlotTitle';
import {RangeSlider} from '../RangeSlider';
import type {RangeSliderHandle} from '../RangeSlider';
import {Title} from '../Title';
import {Tooltip} from '../Tooltip';
import {getInitialRangeSliderState} from '../utils';

import type {ChartInnerProps} from './types';
import {useChartInnerHandlers} from './useChartInnerHandlers';
import {useChartInnerProps} from './useChartInnerProps';
import {useChartInnerState} from './useChartInnerState';
import {getResetZoomButtonStyle, useAsyncState, useDebouncedValue} from './utils';

import './styles.scss';

const b = block('chart');

const DEBOUNCED_VALUE_DELAY = 10;

export const ChartInner = (props: ChartInnerProps) => {
    const {width, height, data} = props;
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const resetZoomButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const [htmlLayout, setHtmlLayout] = React.useState<HTMLDivElement | null>(null);
    const plotRef = React.useRef<SVGGElement | null>(null);
    const plotBeforeRef = React.useRef<SVGGElement | null>(null);
    const plotAfterRef = React.useRef<SVGGElement | null>(null);
    const rangeSliderRef = React.useRef<RangeSliderHandle | null>(null);
    const dispatcher = React.useMemo(() => getDispatcher(), []);
    const clipPathId = useUniqId();
    const preparedTitle = React.useMemo(() => {
        return getPreparedTitle({title: data.title});
    }, [data.title]);
    const preparedChart = React.useMemo(() => {
        return getPreparedChart({
            chart: data.chart,
            seriesData: data.series.data,
            preparedTitle,
        });
    }, [data.chart, data.series.data, preparedTitle]);
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
        rangeSliderState,
        updateRangeSliderState,
        updateZoomState,
        zoomState,
    } = useChartInnerState({
        dispatcher,
        preparedChart,
        preparedRangeSlider,
        tooltip: preparedTooltip,
    });
    const {
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
        xAxis,
        xScale,
        yAxis,
        yScale,
    } = useChartInnerProps({
        ...props,
        clipPathId,
        dispatcher,
        htmlLayout,
        plotNode: plotRef.current,
        preparedChart,
        rangeSliderDomain: rangeSliderRef.current?.getDomain(),
        rangeSliderState,
        svgContainer: svgRef.current,
        updateZoomState,
        zoomState,
    });
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
    const {handleChartClick, handleMouseLeave, throttledHandleMouseMove, throttledHandleTouchMove} =
        useChartInnerHandlers({
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
            tooltipThrottle: preparedTooltip.throttle,
            isOutsideBounds,
        });
    const clickHandler = data.chart?.events?.click;
    const pointerMoveHandler = data.chart?.events?.pointermove;

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
                items.push(axisData);
            }
        }
        return items;
    }, [boundsHeight, boundsOffsetTop, boundsWidth, preparedSeries, preparedSplit, yAxis, yScale]);
    const yAxisDataItems = useAsyncState<AxisYData[]>([], setYAxisDataItems);

    const setXAxisDataItems = React.useCallback(async () => {
        const items: AxisXData[] = [];
        const axis = xAxis;
        const scale = xScale;
        if (axis && scale) {
            const axisData = await prepareXAxisData({
                axis,
                scale,
                boundsWidth,
                boundsOffsetLeft: boundsOffsetLeft,
                boundsOffsetRight: width - boundsWidth - boundsOffsetLeft,
                height: boundsHeight,
            });
            items.push(axisData);
        }
        return items;
    }, [boundsHeight, boundsOffsetLeft, boundsWidth, width, xAxis, xScale]);
    const xAxisDataItems = useAsyncState<AxisXData[]>([], setXAxisDataItems);

    React.useEffect(() => {
        if (!initialized && xScale && xAxis) {
            if (!preparedRangeSlider.enabled || isBandScale(xScale)) {
                setInitialized(true);
                return;
            }

            const defaultRange = preparedRangeSlider.defaultRange;
            const initialRangeSliderState = getInitialRangeSliderState({
                defaultRange,
                preparedSeries,
                preparedXAxis: xAxis,
                xScale,
            });

            updateRangeSliderState(initialRangeSliderState);
            setInitialized(true);
        }
    }, [
        initialized,
        preparedRangeSlider.defaultRange,
        preparedRangeSlider.enabled,
        preparedSeries,
        setInitialized,
        updateRangeSliderState,
        xAxis,
        xScale,
    ]);

    const chartContent = (
        <React.Fragment>
            <defs>
                <clipPath id={clipPathId}>
                    <rect x={0} y={0} width={boundsWidth} height={boundsHeight} />
                </clipPath>
            </defs>
            {preparedTitle && <Title {...preparedTitle} chartWidth={width} />}
            <g transform={`translate(0, ${boundsOffsetTop})`}>
                {preparedSplit.plots.map((plot, index) => {
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
                {xScale && xAxisDataItems.length && (
                    <AxisX
                        htmlLayout={htmlLayout}
                        plotAfterRef={plotAfterRef}
                        plotBeforeRef={plotBeforeRef}
                        preparedAxisData={xAxisDataItems[0]}
                    />
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
            {xAxis?.rangeSlider?.enabled && (
                <RangeSlider
                    boundsOffsetLeft={debouncedOffsetLeft}
                    boundsWidth={debouncedBoundsWidth}
                    height={height}
                    htmlLayout={htmlLayout}
                    onUpdate={updateRangeSliderState}
                    preparedChart={preparedChart}
                    preparedLegend={preparedLegend}
                    preparedSeries={debouncedAllPreparedSeries}
                    preparedSeriesOptions={preparedSeriesOptions}
                    preparedRangeSlider={xAxis.rangeSlider}
                    rangeSliderState={rangeSliderState}
                    ref={rangeSliderRef}
                    width={width}
                    xAxis={data.xAxis}
                    yAxis={data.yAxis}
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
                onPointerMove={throttledHandleMouseMove}
                onMouseLeave={handleMouseLeave}
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
                        '--g-html-layout-transform': `translate(${boundsOffsetLeft}px, ${boundsOffsetTop}px)`,
                    } as React.CSSProperties
                }
            />
            {Object.keys(zoomState).length > 0 && preparedChart.zoom && (
                <Button
                    className={b('reset-zoom-button')}
                    onClick={() => {
                        updateZoomState({});
                        rangeSliderRef.current?.resetState();
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
