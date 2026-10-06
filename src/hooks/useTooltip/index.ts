import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '~core/series/types';

import {getPreparedHovered} from '../../components/Tooltip/DefaultTooltipContent/utils';
import type {HoveredValue} from '../../components/Tooltip/DefaultTooltipContent/utils';
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
import {useHoverResetKey} from '../useHoverResetKey';

interface Args {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    seriesData: PreparedSeries[] | undefined;
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
}

interface TooltipState {
    resetKey: ReturnType<typeof useHoverResetKey>;
    hovered?: TooltipDataChunk[];
    hoveredValues?: HoveredValue[];
    hoveredPlotBands?: ChartTooltipRendererArgs['hoveredPlotBands'];
    hoveredPlotLines?: ChartTooltipRendererArgs['hoveredPlotLines'];
    hoveredPlotShapes?: ChartTooltipRendererArgs['hoveredPlotShapes'];
    pointerPosition?: PointPosition;
}

export const useTooltip = ({dispatcher, tooltip, seriesData, xAxis, yAxis}: Args) => {
    const resetKey = useHoverResetKey({seriesData, xAxis, yAxes: yAxis ?? []});
    const [
        {
            resetKey: previousResetKey,
            hovered,
            hoveredValues,
            hoveredPlotBands,
            hoveredPlotLines,
            hoveredPlotShapes,
            pointerPosition,
        },
        setTooltipState,
    ] = React.useState<TooltipState>({resetKey});
    const prevHovered = React.useRef(hovered);

    // New data or an axis value mapping invalidates old points before children render.
    if (previousResetKey !== resetKey) {
        setTooltipState({resetKey});
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
                    const preparedHovered = getPreparedHovered({
                        hovered: filteredNextHovered ?? [],
                        sorting: tooltip?.sorting,
                        xAxis,
                        yAxes: yAxis,
                    });
                    const sortedHovered = preparedHovered.hovered;
                    const isHoveredChanged = !isEqual(prevHovered.current, sortedHovered);
                    const newTooltipState: TooltipState = {
                        resetKey,
                        hovered: isHoveredChanged ? sortedHovered : prevHovered.current,
                        hoveredValues: preparedHovered.values,
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
    }, [resetKey, dispatcher, tooltip, xAxis, yAxis]);
    return {
        hovered,
        hoveredValues,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        pointerPosition,
    };
};
