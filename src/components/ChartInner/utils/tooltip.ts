import get from 'lodash/get';

import {getDefaultTooltipHeaderFormat} from '~core/utils/tooltip';

import type {PreparedTooltip} from '../../../hooks/types';
import type {ChartData, ChartSeries, ChartXAxis, ChartYAxis} from '../../../types';

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
            tooltip?.headerFormat ??
            getDefaultTooltipHeaderFormat({
                dateTimeLabelFormats: tooltip?.dateTimeLabelFormats,
                seriesData,
                yAxes,
                xAxis,
            }),
    };
};
