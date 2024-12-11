import React from 'react';

import type {Dispatch} from 'd3';

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

    React.useEffect(() => {
        if (tooltip?.enabled) {
            dispatcher.on(
                'hover-shape.tooltip',
                (nextHovered?: TooltipDataChunk[], nextPointerPosition?: PointPosition) => {
                    setTooltipState({hovered: nextHovered, pointerPosition: nextPointerPosition});
                },
            );
        }

        return () => {
            if (tooltip?.enabled) {
                dispatcher.on('hover-shape.tooltip', null);
            }
        };
    }, [dispatcher, tooltip]);

    return {hovered, pointerPosition};
};
