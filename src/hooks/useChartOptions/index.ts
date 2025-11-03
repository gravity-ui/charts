import React from 'react';

import {DEFAULT_PALETTE} from '../../constants';
import type {
    ChartRangeSlider,
    ChartSeries,
    ChartTitle,
    ChartOptions as GeneralChartOptions,
} from '../../types';

import {getPreparedChart} from './chart';
import {getPreparedRangeSlider} from './range-slider';
import {getPreparedTitle} from './title';

type Args = {
    seriesData: ChartSeries[];
    chart?: GeneralChartOptions;
    colors?: string[];
    rangeSlider?: ChartRangeSlider;
    title?: ChartTitle;
};

export const useChartOptions = (args: Args) => {
    const {chart, colors, rangeSlider, seriesData, title} = args;
    const options = React.useMemo(() => {
        const preparedTitle = getPreparedTitle({title});
        const preparedChart = getPreparedChart({
            chart,
            preparedTitle,
            seriesData,
        });
        const preparedRangeSlider = getPreparedRangeSlider({rangeSlider});

        return {
            colors: colors ?? DEFAULT_PALETTE,
            chart: preparedChart,
            rangeSlider: preparedRangeSlider,
            title: preparedTitle,
        };
    }, [chart, colors, rangeSlider, seriesData, title]);

    return options;
};
