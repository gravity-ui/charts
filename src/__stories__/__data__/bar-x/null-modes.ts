import type {BarXSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: BarXSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
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
