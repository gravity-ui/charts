import React from 'react';

import type {Dispatch} from 'd3';

import type {PointPosition, TooltipDataChunk} from '../../types';
import {EventType} from '../../utils';

type Args = {
    dispatcher: Dispatch<object>;
    enabled: boolean;
};

type CrosshairState = {
    hovered?: TooltipDataChunk[];
    pointerPosition?: PointPosition;
};

export const useCrosshairHover = ({dispatcher, enabled}: Args) => {
    const [{hovered, pointerPosition}, setCrosshairState] = React.useState<CrosshairState>({});

    React.useEffect(() => {
        if (enabled) {
            dispatcher.on(
                `${EventType.HOVER_SHAPE}.crosshair`,
                (nextHovered?: TooltipDataChunk[], nextPointerPosition?: PointPosition) => {
                    setCrosshairState({hovered: nextHovered, pointerPosition: nextPointerPosition});
                },
            );
        }

        return () => {
            if (enabled) {
                dispatcher.on(`${EventType.HOVER_SHAPE}.crosshair`, null);
            }
        };
    }, [dispatcher, enabled]);

    return {hovered, pointerPosition};
};
