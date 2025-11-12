import type {BarYSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: BarYSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: null, y: 20},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

export const barYNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
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
            },
        ],
    },
};
