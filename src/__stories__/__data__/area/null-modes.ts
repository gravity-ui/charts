import type {AreaSeriesData, ChartData} from '../../../types';

const dataWithNullsLinearX: AreaSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
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
