import get from 'lodash/get';

import type {PreparedTooltip} from '../../../hooks/types';
import type {ChartData} from '../../../types';

export const getPreparedTooltip = (args: {tooltip: ChartData['tooltip']}): PreparedTooltip => {
    const {tooltip} = args;

    return {
        ...tooltip,
        enabled: get(tooltip, 'enabled', true),
        throttle: tooltip?.throttle ?? 0,
    };
};
