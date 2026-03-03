import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import type {ChartTooltipRendererArgs, PointPosition, TooltipDataChunk} from '../../types';
import type {PreparedTooltip} from '../useChartOptions/types';

type Args = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
};

type TooltipState = {
    hovered?: TooltipDataChunk[];
    hoveredPlots?: ChartTooltipRendererArgs['hoveredPlots'];
    pointerPosition?: PointPosition;
};

export const useTooltip = ({dispatcher, tooltip}: Args) => {
    const [{hovered, hoveredPlots, pointerPosition}, setTooltipState] =
        React.useState<TooltipState>({});
    const prevHovered = React.useRef(hovered);

    React.useEffect(() => {
        if (tooltip?.enabled) {
            dispatcher.on(
                'hover-shape.tooltip',
                (
                    nextHovered?: TooltipDataChunk[],
                    nextPointerPosition?: PointPosition,
                    nextHoveredPlots?: ChartTooltipRendererArgs['hoveredPlots'],
                ) => {
                    const filteredNextHovered = nextHovered?.filter((item) =>
                        'y' in item.data ? item.data.y !== null : true,
                    );
                    const isHoveredChanged = !isEqual(prevHovered.current, filteredNextHovered);
                    const newTooltipState: TooltipState = {
                        hovered: isHoveredChanged ? filteredNextHovered : prevHovered.current,
                        hoveredPlots: nextHoveredPlots,
                        pointerPosition: nextPointerPosition,
                    };

                    if (isHoveredChanged) {
                        prevHovered.current = filteredNextHovered;
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
    }, [dispatcher, tooltip]);
    return {
        hovered,
        hoveredPlots,
        pointerPosition,
    };
};
