import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import {Button, ButtonIcon, useUniqId} from '@gravity-ui/uikit';

import {useCrosshair} from '../../hooks';
import {getPreparedTooltip} from '../../hooks/useChartOptions/tooltip';
import {EventType, block, getDispatcher} from '../../utils';
import {AxisX} from '../AxisX/AxisX';
import {AxisY} from '../AxisY/AxisY';
import {prepareAxisData} from '../AxisY/prepare-axis-data';
import type {AxisYData} from '../AxisY/types';
import {Legend} from '../Legend';
import {PlotTitle} from '../PlotTitle';
import {RangeSlider} from '../RangeSlider';
import {Title} from '../Title';
import {Tooltip} from '../Tooltip';

import type {ChartInnerProps} from './types';
import {useChartInnerHandlers} from './useChartInnerHandlers';
import {useChartInnerProps} from './useChartInnerProps';
import {useChartInnerState} from './useChartInnerState';
import {getResetZoomButtonStyle, useAsyncState, useDebouncedValue} from './utils';

import './styles.scss';

const b = block('chart');

export const ChartInner = (props: ChartInnerProps) => {
    const {width, height, data} = props;
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
    const {
        tooltipPinned,
        togglePinTooltip,
        unpinTooltip,
        rangeSliderState,
        updateRangeSliderState,
        updateZoomState,
        zoomState,
    } = useChartInnerState({
        dispatcher,
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
        preparedChart,
        preparedLegend,
        preparedRangeSlider,
        preparedSeries,
        preparedSeriesOptions,
        preparedSplit,
        preparedZoom,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        svgXPos,
        title,
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
        rangeSliderState,
        svgContainer: svgRef.current,
        updateZoomState,
        zoomState,
    });
    const debouncedBoundsWidth = useDebouncedValue({value: boundsWidth, delay: 10});
    const debouncedOffsetLeft = useDebouncedValue({value: boundsOffsetLeft, delay: 10});
    const debouncedAllPreparedSeries = useDebouncedValue({value: allPreparedSeries, delay: 10});
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
                const axisData = await prepareAxisData({
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
                <defs>
                    <clipPath id={clipPathId}>
                        <rect x={0} y={0} width={boundsWidth} height={boundsHeight} />
                    </clipPath>
                </defs>
                {title && <Title {...title} chartWidth={width} />}
                <g transform={`translate(0, ${boundsOffsetTop})`}>
                    {preparedSplit.plots.map((plot, index) => {
                        return <PlotTitle key={`plot-${index}`} title={plot.title} />;
                    })}
                </g>
                <g
                    width={boundsWidth}
                    height={boundsHeight}
                    transform={`translate(${[boundsOffsetLeft, boundsOffsetTop].join(',')})`}
                    ref={plotRef}
                >
                    {xScale && xAxis && (
                        <g transform={`translate(0, ${boundsHeight})`}>
                            <AxisX
                                axis={xAxis}
                                boundsOffsetLeft={boundsOffsetLeft}
                                boundsOffsetTop={boundsOffsetTop}
                                height={boundsHeight}
                                htmlLayout={htmlLayout}
                                leftmostLimit={svgXPos}
                                plotAfterRef={plotAfterRef}
                                plotBeforeRef={plotBeforeRef}
                                scale={xScale}
                                split={preparedSplit}
                                width={boundsWidth}
                            />
                        </g>
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
                {preparedRangeSlider.enabled && (
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
                        preparedRangeSlider={preparedRangeSlider}
                        rangeSliderState={rangeSliderState}
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
            {Object.keys(zoomState).length > 0 && preparedZoom && (
                <Button
                    onClick={() => updateZoomState({})}
                    ref={resetZoomButtonRef}
                    style={getResetZoomButtonStyle({
                        boundsHeight,
                        boundsOffsetLeft,
                        boundsOffsetTop,
                        boundsWidth,
                        node: resetZoomButtonRef.current,
                        titleHeight: title?.height,
                        ...preparedZoom.resetButton,
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
