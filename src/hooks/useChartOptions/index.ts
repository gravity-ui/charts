import React from 'react';

import type {ChartKitWidgetData} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedTitle} from './title';
import {getPreparedTooltip} from './tooltip';
import type {ChartOptions} from './types';

type Args = {
    data: ChartKitWidgetData;
};

export const useChartOptions = (args: Args): ChartOptions => {
    const {
        data: {chart, title, tooltip},
    } = args;
    const options: ChartOptions = React.useMemo(() => {
        const preparedTitle = getPreparedTitle({title});
        const preparedTooltip = getPreparedTooltip({tooltip});

        const preparedChart = getPreparedChart({
            chart,
            preparedTitle,
        });
        return {
            chart: preparedChart,
            title: preparedTitle,
            tooltip: preparedTooltip,
        };
    }, [chart, title, tooltip]);

    return options;
};
