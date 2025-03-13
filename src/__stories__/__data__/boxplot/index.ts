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
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
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
        categories: ['Group 1', 'Group 2', 'Group 3'],
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
