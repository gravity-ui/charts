import type {BarYSeriesData, ChartData} from '../../../types';

const seriesAWithNull: BarYSeriesData[] = [
    {x: 10, y: 0},
    {x: 15, y: 1},
    {x: null, y: 2},
    {x: 25, y: 3},
    {x: 30, y: 4},
];

const seriesB: BarYSeriesData[] = [
    {x: 5, y: 0},
    {x: 8, y: 1},
    {x: 12, y: 2},
    {x: 7, y: 3},
    {x: 10, y: 4},
];

const categories = ['A', 'B', 'C', 'D', 'E'];

export const barYNullModeSkipGroupedData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series A (null at C)',
                data: seriesAWithNull,
                nullMode: 'skip',
                dataLabels: {enabled: true, inside: true},
            },
            {
                type: 'bar-y',
                name: 'Series B',
                data: seriesB,
                nullMode: 'skip',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    yAxis: [{type: 'category', categories}],
};

export const barYNullModeZeroGroupedData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Series A (null at C)',
                data: seriesAWithNull,
                nullMode: 'zero',
                dataLabels: {enabled: true, inside: true},
            },
            {
                type: 'bar-y',
                name: 'Series B',
                data: seriesB,
                nullMode: 'zero',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    yAxis: [{type: 'category', categories}],
};
