import React from 'react';

import type {Dispatch} from 'd3';

import type {ChartTooltip} from '../../types';
import {EventType, isMacintosh} from '../../utils';

type Props = {
    dispatcher: Dispatch<object>;
    tooltip?: ChartTooltip;
};

export function useChartInnerState(props: Props) {
    const {dispatcher, tooltip} = props;
    const [tooltipPinned, setTooltipPinned] = React.useState(false);
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

    return {
        tooltipPinned,
        togglePinTooltip: tooltipEnabled && tooltipPinEnabled ? togglePinTooltip : undefined,
        unpinTooltip: tooltipEnabled && tooltipPinEnabled ? unpinTooltip : undefined,
    };
}
