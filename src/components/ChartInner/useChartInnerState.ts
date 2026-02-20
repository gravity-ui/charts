import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import type {PreparedRangeSlider, PreparedTooltip, RangeSliderState, ZoomState} from '../../hooks';
import {EventType, isMacintosh} from '../../utils';

type Props = {
    dispatcher: Dispatch<object>;
    preparedRangeSlider: PreparedRangeSlider;
    tooltip?: PreparedTooltip;
};

export function useChartInnerState(props: Props) {
    const {dispatcher, preparedRangeSlider, tooltip} = props;
    const [tooltipPinned, setTooltipPinned] = React.useState(false);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
    const [rangeSliderState, setRangeSliderState] = React.useState<RangeSliderState | undefined>();
    const [initialized, setInitialized] = React.useState(!preparedRangeSlider.enabled);
    const tooltipEnabled = tooltip?.enabled;
    const tooltipPinEnabled = tooltip?.pin?.enabled;
    const modifierKey = tooltip?.pin?.modifierKey;

    const togglePinTooltip = React.useCallback(
        (value: boolean, event: React.MouseEvent) => {
            let resultValue = value;

            if (value && modifierKey) {
                switch (modifierKey) {
                    case 'altKey': {
                        resultValue = event.altKey;
                        break;
                    }
                    case 'metaKey': {
                        resultValue = isMacintosh() ? event.metaKey : event.ctrlKey;
                    }
                }
            }

            setTooltipPinned(resultValue);
        },
        [modifierKey],
    );

    const unpinTooltip = React.useCallback(() => {
        setTooltipPinned(false);
        dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
    }, [dispatcher]);

    const updateZoomState = React.useCallback(
        (nextZoomState: Partial<ZoomState>) => {
            if (!isEqual(zoomState, nextZoomState)) {
                setZoomState(nextZoomState);

                // One-way sync: zoom → range slider. On full reset clear the slider state;
                // on x-zoom change sync slider to the zoomed x range.
                if (Object.keys(nextZoomState).length === 0) {
                    setRangeSliderState(undefined);
                } else if (nextZoomState.x !== undefined) {
                    setRangeSliderState({min: nextZoomState.x[0], max: nextZoomState.x[1]});
                }
            }
        },
        [zoomState],
    );

    const updateRangeSliderState = React.useCallback(
        (nextRangeSliderState?: RangeSliderState) => {
            if (!isEqual(rangeSliderState, nextRangeSliderState)) {
                setRangeSliderState(
                    nextRangeSliderState
                        ? {
                              max: nextRangeSliderState.max,
                              min: nextRangeSliderState.min,
                          }
                        : undefined,
                );
                // Moving the slider clears zoom so the slider is always the sole source of truth.
                // Zoom stays active only until the user explicitly touches the slider.
                setZoomState({});
            }
        },
        [rangeSliderState],
    );

    return {
        initialized,
        rangeSliderState,
        setInitialized,
        tooltipPinned,
        togglePinTooltip: tooltipEnabled && tooltipPinEnabled ? togglePinTooltip : undefined,
        unpinTooltip: tooltipEnabled && tooltipPinEnabled ? unpinTooltip : undefined,
        updateRangeSliderState,
        updateZoomState,
        zoomState,
    };
}
