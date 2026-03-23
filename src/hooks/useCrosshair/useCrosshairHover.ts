import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import {EventType} from '~core/utils';

import type {PointPosition, TooltipDataChunk} from '../../types';

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
