import React from 'react';

import {pointer} from 'd3';
import throttle from 'lodash/throttle';

import {
    useAxisScales,
    useChartDimensions,
    useChartOptions,
    useSeries,
    useShapes,
} from '../../hooks';
import {getYAxisWidth} from '../../hooks/useChartDimensions/utils';
import {getPreparedXAxis} from '../../hooks/useChartOptions/x-axis';
import {getPreparedYAxis} from '../../hooks/useChartOptions/y-axis';
import {useSplit} from '../../hooks/useSplit';
import type {ChartData} from '../../types';
import {block, getD3Dispatcher} from '../../utils';
import {getClosestPoints} from '../../utils/chart/get-closest-data';
import {AxisX, AxisY} from '../Axis';
import {Legend} from '../Legend';
import {PlotTitle} from '../PlotTitle';
import {Title} from '../Title';
import {Tooltip} from '../Tooltip';

import './styles.scss';

const b = block('d3');

const THROTTLE_DELAY = 50;

type Props = {
    width: number;
    height: number;
    data: ChartData;
};

export const Chart = (props: Props) => {
    const {width, height, data} = props;
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const htmlLayerRef = React.useRef<HTMLDivElement | null>(null);
    const dispatcher = React.useMemo(() => {
        return getD3Dispatcher();
    }, []);
    const {chart, title, tooltip} = useChartOptions({
        data,
    });
    const xAxis = React.useMemo(
        () => getPreparedXAxis({xAxis: data.xAxis, width, series: data.series.data}),
        [data, width],
    );
    const yAxis = React.useMemo(
        () =>
            getPreparedYAxis({
                series: data.series.data,
                yAxis: data.yAxis,
                height,
            }),
        [data, height],
    );

    const {
        legendItems,
        legendConfig,
        preparedSeries,
        preparedSeriesOptions,
        preparedLegend,
        handleLegendItemClick,
    } = useSeries({
        chartWidth: width,
        chartHeight: height,
        chartMargin: chart.margin,
        series: data.series,
        legend: data.legend,
        preparedYAxis: yAxis,
    });
    const {boundsWidth, boundsHeight} = useChartDimensions({
        width,
        height,
        margin: chart.margin,
        preparedLegend,
        preparedXAxis: xAxis,
        preparedYAxis: yAxis,
        preparedSeries: preparedSeries,
    });
    const preparedSplit = useSplit({split: data.split, boundsHeight, chartWidth: width});
    const {xScale, yScale} = useAxisScales({
        boundsWidth,
        boundsHeight,
        series: preparedSeries,
        xAxis,
        yAxis,
        split: preparedSplit,
    });
    const {shapes, shapesData} = useShapes({
        boundsWidth,
        boundsHeight,
        dispatcher,
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split: preparedSplit,
        htmlLayout: htmlLayerRef.current,
    });

    const clickHandler = data.chart?.events?.click;
    React.useEffect(() => {
        if (clickHandler) {
            dispatcher.on('click-chart', clickHandler);
        }

        return () => {
            dispatcher.on('click-chart', null);
        };
    }, [dispatcher, clickHandler]);

    const boundsOffsetTop = chart.margin.top;
    // We only need to consider the width of the first left axis
    const boundsOffsetLeft = chart.margin.left + getYAxisWidth(yAxis[0]);

    const isOutsideBounds = React.useCallback(
        (x: number, y: number) => {
            return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
        },
        [boundsHeight, boundsWidth],
    );

    const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = (event) => {
        const [pointerX, pointerY] = pointer(event, svgRef.current);
        const x = pointerX - boundsOffsetLeft;
        const y = pointerY - boundsOffsetTop;
        if (isOutsideBounds(x, y)) {
            dispatcher.call('hover-shape', {}, undefined);
            return;
        }

        const closest = getClosestPoints({
            position: [x, y],
            shapesData,
        });
        dispatcher.call('hover-shape', event.target, closest, [pointerX, pointerY]);
    };
    const throttledHandleMouseMove = throttle(handleMouseMove, THROTTLE_DELAY);

    const handleMouseLeave = () => {
        throttledHandleMouseMove.cancel();
        dispatcher.call('hover-shape', {}, undefined);
    };

    const handleChartClick = React.useCallback(
        (event: React.MouseEvent<SVGSVGElement>) => {
            const [pointerX, pointerY] = pointer(event, svgRef.current);
            const x = pointerX - boundsOffsetLeft;
            const y = pointerY - boundsOffsetTop;
            if (isOutsideBounds(x, y)) {
                return;
            }

            const items = getClosestPoints({
                position: [x, y],
                shapesData,
            });
            const selected = items?.find((item) => item.closest);
            if (!selected) {
                return;
            }

            dispatcher.call(
                'click-chart',
                undefined,
                {point: selected.data, series: selected.series},
                event,
            );
        },
        [boundsOffsetLeft, boundsOffsetTop, dispatcher, isOutsideBounds, shapesData],
    );

    return (
        <React.Fragment>
            <svg
                ref={svgRef}
                className={b()}
                width={width}
                height={height}
                onMouseMove={throttledHandleMouseMove}
                onMouseLeave={handleMouseLeave}
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
            />
        </React.Fragment>
    );
};
