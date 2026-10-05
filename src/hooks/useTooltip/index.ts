import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import {getSortedHovered} from '../../components/Tooltip/DefaultTooltipContent/utils';
import type {
    AxisPlotBand,
    AxisPlotLine,
    AxisPlotShape,
    ChartTooltipRendererArgs,
    PointPosition,
    TooltipDataChunk,
} from '../../types';
import type {PreparedTooltip} from '../types';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

type Args = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis;
};

type TooltipState = {
    hovered?: TooltipDataChunk[];
    hoveredPlotBands?: ChartTooltipRendererArgs['hoveredPlotBands'];
    hoveredPlotLines?: ChartTooltipRendererArgs['hoveredPlotLines'];
    hoveredPlotShapes?: ChartTooltipRendererArgs['hoveredPlotShapes'];
    pointerPosition?: PointPosition;
};

export const useTooltip = ({dispatcher, tooltip, xAxis, yAxis}: Args) => {
    const [
        {hovered, hoveredPlotBands, hoveredPlotLines, hoveredPlotShapes, pointerPosition},
        setTooltipState,
    ] = React.useState<TooltipState>({});
    const prevHovered = React.useRef(hovered);

    React.useEffect(() => {
        if (tooltip?.enabled) {
            dispatcher.on(
                'hover-shape.tooltip',
                (
                    nextHovered?: TooltipDataChunk[],
                    nextPointerPosition?: PointPosition,
                    nextHoveredPlots?: {
                        bands: AxisPlotBand[];
                        lines: AxisPlotLine[];
                        shapes: AxisPlotShape[];
                    },
                ) => {
                    const filteredNextHovered = nextHovered?.filter((item) =>
                        'y' in item.data ? item.data.y !== null : true,
                    );
                    const sortedHovered = getSortedHovered({
                        hovered: filteredNextHovered ?? [],
                        sorting: tooltip?.sorting,
                        xAxis,
                        yAxis,
                    });
                    const isHoveredChanged = !isEqual(prevHovered.current, sortedHovered);
                    const newTooltipState: TooltipState = {
                        hovered: isHoveredChanged ? sortedHovered : prevHovered.current,
                        hoveredPlotBands: nextHoveredPlots?.bands,
                        hoveredPlotLines: nextHoveredPlots?.lines,
                        hoveredPlotShapes: nextHoveredPlots?.shapes,
                        pointerPosition: nextPointerPosition,
                    };

                    if (isHoveredChanged) {
                        prevHovered.current = sortedHovered;
                    }
                    setTooltipState(newTooltipState);
                },
            );
        }

        return () => {
            if (tooltip?.enabled) {
                dispatcher.on('hover-shape.tooltip', null);
            }
        };
    }, [dispatcher, tooltip, xAxis, yAxis]);
    return {
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        pointerPosition,
    };
};
