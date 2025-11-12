import type {ChartData, ScatterSeriesData} from '../../../types';

const dataWithNullsLinearX: ScatterSeriesData[] = [
    {x: 10, y: 10},
    {x: 15, y: 15},
    {x: 20, y: null},
    {x: 25, y: 25},
    {x: 30, y: 30},
];

export const scatterNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
            },
        ],
    },
};

export const scatterNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
            },
        ],
    },
};
