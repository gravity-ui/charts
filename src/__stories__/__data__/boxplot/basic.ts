import {SeriesType} from '../../../constants';
import type {BoxplotSeries, ChartData} from '../../../types';

const boxplotSeriesData: BoxplotSeries[] = [
    {
        type: SeriesType.Boxplot,
        name: 'Temperature Distribution',
        data: [
            {
                x: 'Jan',
                low: -5,
                q1: 0,
                median: 5,
                q3: 10,
                high: 15,
                outliers: [-10, 20],
            },
            {
                x: 'Feb',
                low: -3,
                q1: 2,
                median: 7,
                q3: 12,
                high: 17,
            },
            {
                x: 'Mar',
                low: 0,
                q1: 5,
                median: 10,
                q3: 15,
                high: 20,
                outliers: [-5, 25],
            },
            {
                x: 'Apr',
                low: 5,
                q1: 10,
                median: 15,
                q3: 20,
                high: 25,
            },
            {
                x: 'May',
                low: 10,
                q1: 15,
                median: 20,
                q3: 25,
                high: 30,
                outliers: [5, 35],
            },
        ],
    },
];

export const boxplotBasicData: ChartData = {
    title: {
        text: 'Monthly Temperature Distribution',
    },
    xAxis: {
        type: 'category',
        title: {
            text: 'Month',
        },
    },
    yAxis: [
        {
            type: 'linear',
            title: {
                text: 'Temperature (°C)',
            },
        },
    ],
    series: {
        data: boxplotSeriesData,
        options: {
            boxplot: {
                boxWidth: 0.5,
                whiskerWidth: 0.5,
                showOutliers: true,
                outlierRadius: 3,
            },
        },
    },
    tooltip: {
        enabled: true,
    },
};
