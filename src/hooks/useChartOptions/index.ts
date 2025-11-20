import React from 'react';

import {DEFAULT_PALETTE} from '../../constants';
import type {
    ChartSeries,
    ChartTitle,
    ChartXAxis,
    ChartOptions as GeneralChartOptions,
} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedTitle} from './title';

type Args = {
    seriesData: ChartSeries[];
    chart?: GeneralChartOptions;
    colors?: string[];
    title?: ChartTitle;
    xAxis?: ChartXAxis;
};

export const useChartOptions = (args: Args) => {
    const {chart, colors, seriesData, title} = args;
    const options = React.useMemo(() => {
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
