import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '~core/series/types';

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

interface Args {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    seriesData?: PreparedSeries[];
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis;
}

interface TooltipAxes {
    xType: PreparedXAxis['type'];
    yType: PreparedYAxis['type'];
    xCategories?: string[];
    yCategories?: string[];
}

interface TooltipState {
    axes: TooltipAxes;
    seriesData?: PreparedSeries[];
    hovered?: TooltipDataChunk[];
    hoveredPlotBands?: ChartTooltipRendererArgs['hoveredPlotBands'];
    hoveredPlotLines?: ChartTooltipRendererArgs['hoveredPlotLines'];
    hoveredPlotShapes?: ChartTooltipRendererArgs['hoveredPlotShapes'];
    pointerPosition?: PointPosition;
}

export const useTooltip = ({dispatcher, tooltip, seriesData, xAxis, yAxis}: Args) => {
    const axes = React.useMemo<TooltipAxes>(
        () => ({
            xType: xAxis?.type ?? 'linear',
            yType: yAxis?.type ?? 'linear',
            xCategories: xAxis?.type === 'category' ? (xAxis.categories ?? []) : undefined,
            yCategories: yAxis?.type === 'category' ? (yAxis.categories ?? []) : undefined,
        }),
        [xAxis?.type, xAxis?.categories, yAxis?.type, yAxis?.categories],
    );
    const [
        {
            axes: previousAxes,
            seriesData: previousSeriesData,
            hovered,
            hoveredPlotBands,
            hoveredPlotLines,
            hoveredPlotShapes,
            pointerPosition,
        },
        setTooltipState,
    ] = React.useState<TooltipState>({axes, seriesData});
    const prevHovered = React.useRef(hovered);

    // New data or an axis value mapping invalidates old points before children render.
    if (previousSeriesData !== seriesData || !isEqual(previousAxes, axes)) {
        setTooltipState({axes, seriesData});
        prevHovered.current = undefined;
    }

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
                        axes,
                        seriesData,
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
    }, [axes, dispatcher, tooltip, seriesData, xAxis, yAxis]);
    return {
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        pointerPosition,
    };
};
