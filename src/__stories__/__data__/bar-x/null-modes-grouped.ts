import type {BarXSeriesData, ChartData} from '../../../types';

const seriesAWithNull: BarXSeriesData[] = [
    {x: 0, y: 10},
    {x: 1, y: 15},
    {x: 2, y: null},
    {x: 3, y: 25},
    {x: 4, y: 30},
];

const seriesB: BarXSeriesData[] = [
    {x: 0, y: 5},
    {x: 1, y: 8},
    {x: 2, y: 12},
    {x: 3, y: 7},
    {x: 4, y: 10},
];

const categories = ['A', 'B', 'C', 'D', 'E'];

export const barXNullModeSkipGroupedData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series A (null at C)',
                data: seriesAWithNull,
                nullMode: 'skip',
                dataLabels: {enabled: true, inside: true},
            },
            {
                type: 'bar-x',
                name: 'Series B',
                data: seriesB,
                nullMode: 'skip',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    xAxis: {type: 'category', categories},
};

export const barXNullModeZeroGroupedData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Series A (null at C)',
                data: seriesAWithNull,
                nullMode: 'zero',
                dataLabels: {enabled: true, inside: true},
            },
            {
                type: 'bar-x',
                name: 'Series B',
                data: seriesB,
                nullMode: 'zero',
                dataLabels: {enabled: true, inside: true},
            },
        ],
    },
    xAxis: {type: 'category', categories},
};
