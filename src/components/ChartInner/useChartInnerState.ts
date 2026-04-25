import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import isEqual from 'lodash/isEqual';

import {EventType, isMacintosh} from '~core/utils';

import type {PreparedRangeSlider, PreparedTooltip, ZoomState} from '../../hooks';

type Props = {
    dispatcher: Dispatch<object>;
    preparedRangeSlider: PreparedRangeSlider;
    tooltip?: PreparedTooltip;
};

export function useChartInnerState(props: Props) {
    const {dispatcher, preparedRangeSlider, tooltip} = props;
    const [tooltipPinned, setTooltipPinned] = React.useState(false);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
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
                dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
            }
        },
        [dispatcher, zoomState],
    );

    return {
        initialized,
        setInitialized,
        tooltipPinned,
        togglePinTooltip: tooltipEnabled && tooltipPinEnabled ? togglePinTooltip : undefined,
        unpinTooltip: tooltipEnabled && tooltipPinEnabled ? unpinTooltip : undefined,
        updateZoomState,
        zoomState,
    };
}
