import type {BarXSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: BarXSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

const dataWithNullsCategoryX: BarXSeriesData[] = [
    {x: 0, y: 10},
    {x: 1, y: 15},
    {x: 2, y: null},
    {x: 3, y: 25},
    {x: 4, y: 30},
];

export const barXNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
            },
        ],
    },
};

export const barXNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
            },
        ],
    },
};

export const barXNullModeSkipCategoryXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series',
                data: dataWithNullsCategoryX,
                nullMode: 'skip',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['A', 'B', 'C', 'D', 'E'],
    },
};

export const barXNullModeZeroCategoryXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series',
                data: dataWithNullsCategoryX,
                nullMode: 'zero',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['A', 'B', 'C', 'D', 'E'],
    },
};
