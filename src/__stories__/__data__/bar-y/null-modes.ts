import type {BarYSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: BarYSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: null, y: 20},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

const dataWithNullsCategoryY: BarYSeriesData[] = [
    {x: 10, y: 0},
    {x: 15, y: 1},
    {x: null, y: 2},
    {x: 25, y: 3},
    {x: 30, y: 4},
];

export const barYNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
                dataLabels: {
                    enabled: true,
                    inside: true,
                },
            },
        ],
    },
};

export const barYNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
                dataLabels: {
                    enabled: true,
                    inside: true,
                },
            },
        ],
    },
};

export const barYNullModeSkipCategoryYData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series',
                data: dataWithNullsCategoryY,
                nullMode: 'skip',
                dataLabels: {
                    enabled: true,
                    inside: true,
                },
            },
        ],
    },
    yAxis: [
        {
            type: 'category',
            categories: ['A', 'B', 'C', 'D', 'E'],
        },
    ],
};

export const barYNullModeZeroCategoryYData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series',
                data: dataWithNullsCategoryY,
                nullMode: 'zero',
                dataLabels: {
                    enabled: true,
                    inside: true,
                },
            },
        ],
    },
    yAxis: [
        {
            type: 'category',
            categories: ['A', 'B', 'C', 'D', 'E'],
        },
    ],
};
