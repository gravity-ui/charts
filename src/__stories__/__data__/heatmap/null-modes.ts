import type {ChartData, HeatmapSeriesData} from '../../../types';

const dataWithNullsLinearX: HeatmapSeriesData[] = [
    {x: 10, y: 10, value: 10},
    {x: 15, y: 15, value: 15},
    {x: 20, y: 20, value: null},
    {x: 25, y: 25, value: 25},
    {x: 30, y: 30, value: 30},
];

export const heatmapNullModeSkipLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'heatmap',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'skip',
            },
        ],
    },
};

export const heatmapNullModeZeroLinearXData: ChartData = {
    series: {
        data: [
            {
                type: 'heatmap',
                name: 'Series',
                data: dataWithNullsLinearX,
                nullMode: 'zero',
            },
        ],
    },
};
