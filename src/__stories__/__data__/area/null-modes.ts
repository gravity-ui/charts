import type {AreaSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: AreaSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

const dataWithNullsCategoryX: AreaSeriesData[] = [
    {x: 0, y: 10},
    {x: 1, y: 15},
    {x: 2, y: null},
    {x: 3, y: 25},
    {x: 4, y: 30},
];

export const areaNullModeConnectLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'connect',
            },
        ],
    },
};

export const areaNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
            },
        ],
    },
};

export const areaNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
            },
        ],
    },
};

export const areaNullModeSkipCategoryXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsCategoryX,
                nullMode: 'skip',
                dataLabels: {enabled: true},
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['A', 'B', 'C', 'D', 'E'],
    },
};

export const areaNullModeConnectCategoryXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsCategoryX,
                nullMode: 'connect',
                dataLabels: {enabled: true},
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['A', 'B', 'C', 'D', 'E'],
    },
};

export const areaNullModeZeroCategoryXData: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Series',
                data: dataWithNullsCategoryX,
                nullMode: 'zero',
                dataLabels: {enabled: true},
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['A', 'B', 'C', 'D', 'E'],
    },
};
