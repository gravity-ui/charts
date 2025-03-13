import {SeriesType} from '../../../constants';
import type {BoxplotSeries, ChartData} from '../../../types';

const multipleBoxplotSeriesData: BoxplotSeries[] = [
    {
        type: SeriesType.Boxplot,
        name: 'Dataset A',
        color: '#4DA2F1',
        data: [
            {
                x: 'Group 1',
                low: 10,
                q1: 15,
                median: 20,
                q3: 25,
                high: 30,
                outliers: [5, 35],
            },
            {
                x: 'Group 2',
                low: 12,
                q1: 18,
                median: 24,
                q3: 28,
                high: 32,
            },
            {
                x: 'Group 3',
                low: 8,
                q1: 13,
                median: 19,
                q3: 23,
                high: 28,
                outliers: [3, 33],
            },
        ],
    },
    {
        type: SeriesType.Boxplot,
        name: 'Dataset B',
        color: '#FF3D64',
        data: [
            {
                x: 'Group 1',
                low: 5,
                q1: 10,
                median: 15,
                q3: 20,
                high: 25,
                outliers: [2, 28],
            },
            {
                x: 'Group 2',
                low: 7,
                q1: 12,
                median: 17,
                q3: 22,
                high: 27,
            },
            {
                x: 'Group 3',
                low: 9,
                q1: 14,
                median: 19,
                q3: 24,
                high: 29,
                outliers: [4, 34],
            },
        ],
    },
];

export const boxplotMultipleData: ChartData = {
    title: {
        text: 'Comparison of Multiple Datasets',
    },
    xAxis: {
        type: 'category',
        title: {
            text: 'Group',
        },
    },
    yAxis: [
        {
            type: 'linear',
            title: {
                text: 'Value',
            },
        },
    ],
    series: {
        data: multipleBoxplotSeriesData,
        options: {
            boxplot: {
                boxWidth: 0.4,
                whiskerWidth: 0.5,
                showOutliers: true,
                outlierRadius: 3,
                boxPadding: 0.2,
            },
        },
    },
    legend: {
        enabled: true,
        align: 'center',
    },
    tooltip: {
        enabled: true,
    },
};
