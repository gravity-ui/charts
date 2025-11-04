import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import type {PointPosition, TooltipDataChunk} from '../../types';
import type {PreparedTooltip} from '../useChartOptions/types';

type Args = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
};

type TooltipState = {
    hovered?: TooltipDataChunk[];
    pointerPosition?: PointPosition;
};

export const useTooltip = ({dispatcher, tooltip}: Args) => {
    const [{hovered, pointerPosition}, setTooltipState] = React.useState<TooltipState>({});
    const prevHovered = React.useRef(hovered);

    React.useEffect(() => {
        if (tooltip?.enabled) {
            dispatcher.on(
                'hover-shape.tooltip',
                (nextHovered?: TooltipDataChunk[], nextPointerPosition?: PointPosition) => {
                    const filteredNextHovered = nextHovered?.filter((item) =>
                        'y' in item.data ? item.data.y !== null : true,
                    );
                    const isHoveredChanged = !isEqual(prevHovered.current, filteredNextHovered);
                    const newTooltipState = {
                        pointerPosition: nextPointerPosition,
                        hovered: isHoveredChanged ? filteredNextHovered : prevHovered.current,
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
        pointerPosition,
    };
};
