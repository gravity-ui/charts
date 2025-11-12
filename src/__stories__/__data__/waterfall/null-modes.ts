import type {ChartData, WaterfallSeriesData} from '../../../types';

const dataWithNulls: WaterfallSeriesData[] = [
    {x: 'A', y: 10},
    {x: 'B', y: 15},
    {x: 'C', y: null},
    {x: 'D', y: 25},
    {x: 'Total', total: true},
];

export const waterfallNullModeSkipData: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Series',
                data: dataWithNulls,
                nullMode: 'skip',
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: dataWithNulls.map((d) => d.x) as string[],
    },
};

export const waterfallNullModeZeroData: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Series',
                data: dataWithNulls,
                nullMode: 'zero',
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: dataWithNulls.map((d) => d.x) as string[],
    },
};
