import React from 'react';

import {DEFAULT_PALETTE} from '../../constants';
import type {ChartData} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedTitle} from './title';
import {getPreparedTooltip} from './tooltip';
import type {ChartOptions} from './types';

type Args = {
    data: ChartData;
};

export const useChartOptions = (args: Args): ChartOptions => {
    const {
        data: {chart, title, tooltip, colors, series},
    } = args;
    const options: ChartOptions = React.useMemo(() => {
        const preparedTitle = getPreparedTitle({title});
        const preparedTooltip = getPreparedTooltip({tooltip});
        const preparedChart = getPreparedChart({
            chart,
            preparedTitle,
            seriesData: series.data,
        });

        return {
            chart: preparedChart,
            title: preparedTitle,
            tooltip: preparedTooltip,
            colors: colors ?? DEFAULT_PALETTE,
        };
    }, [chart, colors, title, tooltip, series.data]);

    return options;
};
