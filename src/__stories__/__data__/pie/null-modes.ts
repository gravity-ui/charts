import type {ChartData, PieSeriesData} from '../../../types';

const dataWithNulls: PieSeriesData[] = [
    {name: 'A', value: 10},
    {name: 'B', value: 15},
    {name: 'C', value: null},
    {name: 'D', value: 25},
    {name: 'E', value: 30},
];

export const pieNullModeSkipData: ChartData = {
    series: {
        data: [
            {
                type: 'pie',
                data: dataWithNulls,
                nullMode: 'skip',
            },
        ],
    },
};

export const pieNullModeZeroData: ChartData = {
    series: {
        data: [
            {
                type: 'pie',
                data: dataWithNulls,
                nullMode: 'zero',
            },
        ],
    },
};
