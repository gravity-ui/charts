import React from 'react';

import {EventType, block, getD3Dispatcher} from '../../utils';
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

const b = block('d3');

export const ChartInner = (props: ChartInnerProps) => {
    const {width, height, data} = props;
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const htmlLayerRef = React.useRef<HTMLDivElement | null>(null);
    const dispatcher = React.useMemo(() => getD3Dispatcher(), []);
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
    } = useChartInnerProps({...props, dispatcher, htmlLayout: htmlLayerRef.current});
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
            svgContainer: svgRef.current,
            togglePinTooltip,
            tooltipPinned,
            unpinTooltip,
            xAxis,
            yAxis,
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
                ref={svgRef}
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
                >
                    {xScale && yScale?.length && (
                        <React.Fragment>
                            <AxisY
                                axes={yAxis}
                                width={boundsWidth}
                                height={boundsHeight}
                                scale={yScale}
                                split={preparedSplit}
                            />
                            <g transform={`translate(0, ${boundsHeight})`}>
                                <AxisX
                                    axis={xAxis}
                                    width={boundsWidth}
                                    height={boundsHeight}
                                    scale={xScale}
                                    split={preparedSplit}
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
                ref={htmlLayerRef}
                style={{
                    transform: `translate(${boundsOffsetLeft}px, ${boundsOffsetTop}px)`,
                }}
            />
            <Tooltip
                dispatcher={dispatcher}
                tooltip={tooltip}
                svgContainer={svgRef.current}
                xAxis={xAxis}
                yAxis={yAxis[0]}
                onOutsideClick={unpinTooltip}
                tooltipPinned={tooltipPinned}
            />
        </React.Fragment>
    );
};
