import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import {EventType} from '~core/utils/dispatcher';

import type {LegendTooltipTarget} from '../components/Legend/tooltip-controller';

export function useLegendTooltip(dispatcher: Dispatch<object>) {
    const [target, setTarget] = React.useState<LegendTooltipTarget>();
    React.useLayoutEffect(() => {
        dispatcher.on(`${EventType.LEGEND_TOOLTIP}.view`, setTarget);
        return () => {
            dispatcher.on(`${EventType.LEGEND_TOOLTIP}.view`, null);
        };
    }, [dispatcher]);
    return target;
}
