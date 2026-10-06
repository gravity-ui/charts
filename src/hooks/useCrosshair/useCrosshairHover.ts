import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import {EventType} from '~core/utils';

import type {PointPosition, TooltipDataChunk} from '../../types';
import type {useHoverResetKey} from '../useHoverResetKey';

interface Args {
    dispatcher: Dispatch<object>;
    enabled: boolean;
    resetKey: ReturnType<typeof useHoverResetKey>;
}

interface CrosshairState {
    resetKey: Args['resetKey'];
    hovered?: TooltipDataChunk[];
    pointerPosition?: PointPosition;
}

export const useCrosshairHover = ({dispatcher, enabled, resetKey}: Args) => {
    const [{resetKey: previousResetKey, hovered, pointerPosition}, setCrosshairState] =
        React.useState<CrosshairState>({resetKey});

    // Clear stale points before the crosshair effect resolves them against the new axes.
    if (previousResetKey !== resetKey) {
        setCrosshairState({resetKey});
    }

    React.useEffect(() => {
        if (enabled) {
            dispatcher.on(
                `${EventType.HOVER_SHAPE}.crosshair`,
                (nextHovered?: TooltipDataChunk[], nextPointerPosition?: PointPosition) => {
                    setCrosshairState({
                        resetKey,
                        hovered: nextHovered,
                        pointerPosition: nextPointerPosition,
                    });
                },
            );
        }

        return () => {
            if (enabled) {
                dispatcher.on(`${EventType.HOVER_SHAPE}.crosshair`, null);
            }
        };
    }, [dispatcher, enabled, resetKey]);

    return {hovered, pointerPosition};
};
