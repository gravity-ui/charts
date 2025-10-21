import React from 'react';

import {DEFAULT_PALETTE} from '../../constants';
import type {
    ChartSeries,
    ChartTitle,
    ChartTooltip,
    ChartXAxis,
    ChartYAxis,
    ChartOptions as GeneralChartOptions,
} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedTitle} from './title';
import {getPreparedTooltip} from './tooltip';
import type {ChartOptions} from './types';

type Args = {
    seriesData: ChartSeries[];
    chart?: GeneralChartOptions;
    colors?: string[];
    title?: ChartTitle;
    tooltip?: ChartTooltip;
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
};

export const useChartOptions = (args: Args): ChartOptions => {
    const {chart, colors, seriesData, title, tooltip, yAxes, xAxis} = args;
    const options: ChartOptions = React.useMemo(() => {
        const preparedTitle = getPreparedTitle({title});
        const preparedTooltip = getPreparedTooltip({tooltip, seriesData, yAxes, xAxis});
        const preparedChart = getPreparedChart({
            chart,
            preparedTitle,
            seriesData,
        });

        return {
            colors: colors ?? DEFAULT_PALETTE,
            chart: preparedChart,
            title: preparedTitle,
            tooltip: preparedTooltip,
        };
    }, [chart, colors, seriesData, title, tooltip, xAxis, yAxes]);

    return options;
};
