import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import type {PreparedTooltip, ZoomState} from '../../hooks';
import {EventType, isMacintosh} from '../../utils';

type Props = {
    dispatcher: Dispatch<object>;
    tooltip?: PreparedTooltip;
};

export function useChartInnerState(props: Props) {
    const {dispatcher, tooltip} = props;
    const [tooltipPinned, setTooltipPinned] = React.useState(false);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
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
            }
        },
        [zoomState],
    );

    return {
        tooltipPinned,
        togglePinTooltip: tooltipEnabled && tooltipPinEnabled ? togglePinTooltip : undefined,
        unpinTooltip: tooltipEnabled && tooltipPinEnabled ? unpinTooltip : undefined,
        updateZoomState,
        zoomState,
    };
}
