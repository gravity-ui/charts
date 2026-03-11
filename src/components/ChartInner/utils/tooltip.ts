import get from 'lodash/get';

import type {PreparedTooltip} from '../../../hooks/types';
import type {ChartData, ChartSeries, ChartXAxis, ChartYAxis} from '../../../types';
import {getDefaultTooltipHeaderFormat} from '../../../utils/chart/tooltip';

export const getPreparedTooltip = (args: {
    tooltip: ChartData['tooltip'];
    seriesData: ChartSeries[];
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
}): PreparedTooltip => {
    const {tooltip, seriesData, yAxes, xAxis} = args;

    return {
        ...tooltip,
        enabled: get(tooltip, 'enabled', true),
        throttle: tooltip?.throttle ?? 0,
        headerFormat:
            tooltip?.headerFormat ?? getDefaultTooltipHeaderFormat({seriesData, yAxes, xAxis}),
    };
};
