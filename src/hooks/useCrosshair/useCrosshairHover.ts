import React from 'react';

import type {Dispatch} from 'd3';

import type {CrosshairDataChunk, PointPosition} from '../../types';

type Args = {
    dispatcher: Dispatch<object>;
    enabled: boolean;
};

type CrosshairState = {
    hovered?: CrosshairDataChunk[];
    pointerPosition?: PointPosition;
};

export const useCrosshairHover = ({dispatcher, enabled}: Args) => {
    const [{hovered, pointerPosition}, setTooltipState] = React.useState<CrosshairState>({});

    React.useEffect(() => {
        if (enabled) {
            dispatcher.on(
                `hover-shape.crosshair`,
                (nextHovered?: CrosshairDataChunk[], nextPointerPosition?: PointPosition) => {
                    setTooltipState({hovered: nextHovered, pointerPosition: nextPointerPosition});
                },
            );
        }

        return () => {
            if (enabled) {
                dispatcher.on(`hover-shape.crosshair`, null);
            }
        };
    }, [dispatcher, enabled]);

    return {hovered, pointerPosition};
};
