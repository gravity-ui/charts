import React from 'react';

import type {Dispatch} from 'd3';

import {EventType} from '../../../utils/d3-dispatcher';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import {prepareBoxplotData} from './prepare-data';
import type {PreparedBoxplotData} from './types';

interface BoxplotSeriesShapeProps {
    dispatcher: Dispatch<object>;
    preparedData: PreparedBoxplotData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
}

export {prepareBoxplotData};

export const BoxplotSeriesShape = (props: BoxplotSeriesShapeProps) => {
    const {dispatcher, preparedData, htmlLayout} = props;

    const handleMouseEnter = React.useCallback(
        (event: React.MouseEvent<SVGGElement>, data: PreparedBoxplotData) => {
            dispatcher.call(EventType.HOVER_SHAPE, event, data);
        },
        [dispatcher],
    );

    const handleMouseLeave = React.useCallback(
        (event: React.MouseEvent<SVGGElement>) => {
            dispatcher.call(EventType.HOVER_SHAPE, event, null);
        },
        [dispatcher],
    );

    const handleClick = React.useCallback(
        (event: React.MouseEvent<SVGGElement>, data: PreparedBoxplotData) => {
            dispatcher.call(EventType.CLICK_CHART, event, data);
        },
        [dispatcher],
    );

    return (
        <g className="boxplot-series">
            {preparedData.map((data) => {
                const {
                    id,
                    color,
                    xPosition,
                    yQ1,
                    yQ3,
                    boxWidth,
                    boxHeight,
                    whiskerTop,
                    whiskerBottom,
                    verticalLineTop,
                    verticalLineBottom,
                    outlierPoints,
                    outlierRadius,
                    yMedian,
                } = data;

                return (
                    <g
                        key={id}
                        className="boxplot-box"
                        onMouseEnter={(e) => handleMouseEnter(e, data)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => handleClick(e, data)}
                    >
                        {/* Box */}
                        <rect
                            x={xPosition - boxWidth / 2}
                            y={Math.min(yQ1, yQ3)} // Use the smaller y value (higher on screen) as the top of the box
                            width={boxWidth}
                            height={boxHeight}
                            fill={color}
                            fillOpacity={0.6} // Reduced opacity to match Highcharts
                            stroke={color}
                            strokeWidth={1.5} // Slightly thicker border
                        />

                        {/* Median line */}
                        <line
                            x1={xPosition - boxWidth / 2}
                            y1={yMedian}
                            x2={xPosition + boxWidth / 2}
                            y2={yMedian}
                            stroke="#000"
                            strokeWidth={2} // Make median line more prominent
                        />

                        {/* Whiskers */}
                        <line
                            x1={whiskerTop.x1}
                            y1={whiskerTop.y1}
                            x2={whiskerTop.x2}
                            y2={whiskerTop.y2}
                            stroke={color}
                            strokeWidth={1.5} // Thicker whiskers
                        />
                        <line
                            x1={whiskerBottom.x1}
                            y1={whiskerBottom.y1}
                            x2={whiskerBottom.x2}
                            y2={whiskerBottom.y2}
                            stroke={color}
                            strokeWidth={1.5} // Thicker whiskers
                        />

                        {/* Vertical lines */}
                        <line
                            x1={verticalLineTop.x1}
                            y1={verticalLineTop.y1}
                            x2={verticalLineTop.x2}
                            y2={verticalLineTop.y2}
                            stroke={color}
                            strokeWidth={1.5} // Thicker vertical lines
                        />
                        <line
                            x1={verticalLineBottom.x1}
                            y1={verticalLineBottom.y1}
                            x2={verticalLineBottom.x2}
                            y2={verticalLineBottom.y2}
                            stroke={color}
                            strokeWidth={1.5} // Thicker vertical lines
                        />

                        {/* Outliers */}
                        {outlierPoints.map((point, index) => (
                            <circle
                                key={`${id}-outlier-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={outlierRadius}
                                fill="#fff" // White fill for better visibility
                                stroke={color}
                                strokeWidth={1.5} // Thicker stroke
                            />
                        ))}
                    </g>
                );
            })}
            {htmlLayout && <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />}
        </g>
    );
};
