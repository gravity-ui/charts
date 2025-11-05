import React from 'react';

import {DEFAULT_PALETTE} from '../../constants';
import type {ChartSeries, ChartTitle, ChartOptions as GeneralChartOptions} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedTitle} from './title';
import type {ChartOptions} from './types';

type Args = {
    seriesData: ChartSeries[];
    chart?: GeneralChartOptions;
    colors?: string[];
    title?: ChartTitle;
};

export const useChartOptions = (args: Args): ChartOptions => {
    const {chart, colors, seriesData, title} = args;
    const options: ChartOptions = React.useMemo(() => {
        const preparedTitle = getPreparedTitle({title});
        const preparedChart = getPreparedChart({
            chart,
            preparedTitle,
            seriesData,
        });

        return {
            colors: colors ?? DEFAULT_PALETTE,
            chart: preparedChart,
            title: preparedTitle,
        };
    }, [chart, colors, seriesData, title]);

    return options;
};
