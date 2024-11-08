import get from 'lodash/get';

import type {ChartData} from '../../types';

import type {PreparedTooltip} from './types';

export const getPreparedTooltip = (args: {tooltip: ChartData['tooltip']}): PreparedTooltip => {
    const {tooltip} = args;

    return {
        ...tooltip,
        enabled: get(tooltip, 'enabled', true),
    };
};
