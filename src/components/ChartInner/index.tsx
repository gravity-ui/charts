import React from 'react';

import {EventType, block, getDispatcher} from '../../utils';
import {AxisX, AxisY} from '../Axis';
import {Legend} from '../Legend';
import {PlotTitle} from '../PlotTitle';
import {Title} from '../Title';
import {Tooltip} from '../Tooltip';

import type {ChartInnerProps} from './types';
import {useChartInnerHandlers} from './useChartInnerHandlers';
import {useChartInnerProps} from './useChartInnerProps';
import {useChartInnerState} from './useChartInnerState';

import './styles.scss';

const b = block('chart');

export const ChartInner = (props: ChartInnerProps) => {
    const {width, height, data} = props;
    const [svgContainer, setSvgContainer] = React.useState<SVGSVGElement | null>(null);
    const [htmlLayout, setHtmlLayout] = React.useState<HTMLDivElement | null>(null);
    const plotRef = React.useRef<SVGGElement | null>(null);
    const dispatcher = React.useMemo(() => getDispatcher(), []);
    const {
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        legendConfig,
        legendItems,
        preparedSeries,
        preparedSplit,
        preparedLegend,
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
        svgXPos,
        svgBottomPos,
    } = useChartInnerProps({
        ...props,
        dispatcher,
        htmlLayout,
        svgContainer,
    });
    const {tooltipPinned, togglePinTooltip, unpinTooltip} = useChartInnerState({
        dispatcher,
        tooltip,
    });
    const {handleChartClick, handleMouseLeave, throttledHandleMouseMove, throttledHandleTouchMove} =
        useChartInnerHandlers({
            boundsHeight,
            boundsOffsetLeft,
            boundsOffsetTop,
            boundsWidth,
            dispatcher,
            shapesData,
            svgContainer,
            togglePinTooltip,
            tooltipPinned,
            unpinTooltip,
            xAxis,
            yAxis,
            tooltipThrottle: tooltip.throttle,
        });
    const clickHandler = data.chart?.events?.click;
    const pointerMoveHandler = data.chart?.events?.pointermove;

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

    return (
        <React.Fragment>
            <svg
                ref={setSvgContainer}
                className={b()}
                width={width}
                height={height}
                onMouseMove={throttledHandleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={throttledHandleTouchMove}
                onTouchMove={throttledHandleTouchMove}
                onClick={handleChartClick}
            >
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
                    {xScale && yScale?.length && (
                        <React.Fragment>
                            <AxisY
                                bottomLimit={svgBottomPos}
                                axes={yAxis}
                                width={boundsWidth}
                                height={boundsHeight}
                                scale={yScale}
                                split={preparedSplit}
                                plotRef={plotRef}
                            />
                            <g transform={`translate(0, ${boundsHeight})`}>
                                <AxisX
                                    leftmostLimit={svgXPos}
                                    axis={xAxis}
                                    width={boundsWidth}
                                    height={boundsHeight}
                                    scale={xScale}
                                    split={preparedSplit}
                                    plotRef={plotRef}
                                />
                            </g>
                        </React.Fragment>
                    )}
                    {shapes}
                </g>
                {preparedLegend.enabled && (
                    <Legend
                        chartSeries={preparedSeries}
                        boundsWidth={boundsWidth}
                        legend={preparedLegend}
                        items={legendItems}
                        config={legendConfig}
                        onItemClick={handleLegendItemClick}
                        onUpdate={unpinTooltip}
                    />
                )}
            </svg>
            <div
                className={b('html-layer')}
                ref={setHtmlLayout}
                style={{
                    transform: `translate(${boundsOffsetLeft}px, ${boundsOffsetTop}px)`,
                }}
            />
            <Tooltip
                dispatcher={dispatcher}
                tooltip={tooltip}
                svgContainer={svgContainer}
                xAxis={xAxis}
                yAxis={yAxis[0]}
                onOutsideClick={unpinTooltip}
                tooltipPinned={tooltipPinned}
            />
        </React.Fragment>
    );
};
