import type {ChartData, LineSeriesData} from '../../../types';

const dataWithNullsLinearX: LineSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

export const lineNullModeConnectLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'connect',
            },
        ],
    },
};

export const lineNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
            },
        ],
    },
};

export const lineNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
            },
        ],
    },
};
