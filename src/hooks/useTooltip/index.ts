import React from 'react';

import type {Dispatch} from 'd3';

import type {TooltipDataChunk} from '../../types';
import type {PreparedTooltip} from '../useChartOptions/types';

import type {PointerPosition} from './types';

type Args = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
};

type TooltipState = {
    hovered?: TooltipDataChunk[];
    pointerPosition?: PointerPosition;
};

export const useTooltip = ({dispatcher, tooltip}: Args) => {
    const [{hovered, pointerPosition}, setTooltipState] = React.useState<TooltipState>({});

    React.useEffect(() => {
        if (tooltip?.enabled) {
            dispatcher.on(
                'hover-shape.tooltip',
                (nextHovered?: TooltipDataChunk[], nextPointerPosition?: PointerPosition) => {
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
