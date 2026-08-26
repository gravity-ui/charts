import type {AreaSeries, AreaSeriesData, ChartData} from '../../../types';

const data: AreaSeriesData[] = [
    {x: 0, y: 10},
    {x: 1, y: 30},
    {x: 2, y: 20},
    {x: 3, y: 50},
    {x: 4, y: 40},
    {x: 5, y: 70},
    {x: 6, y: 60},
];

const series: AreaSeries[] = [
    {
        type: 'area',
        name: 'Gradient area (left→right)',
        color: {
            type: 'linear-gradient',
            angle: 90,
            stops: [
                {offset: 0, color: '#ff0000'},
                {offset: 0.5, color: '#00ff00'},
                {offset: 1, color: '#0000ff'},
            ],
        },
        marker: {
            enabled: true,
        },
        data,
    },
    {
        type: 'area',
        name: 'Solid line + gradient area',
        color: '#888888',
        fillColor: {
            type: 'linear-gradient',
            angle: 180,
            stops: [
                {offset: 0, color: '#9b5de5'},
                {offset: 1, color: '#f15bb5'},
            ],
        },
        data: [
            {x: 0, y: 5},
            {x: 1, y: 15},
            {x: 2, y: 25},
            {x: 3, y: 35},
            {x: 4, y: 45},
            {x: 5, y: 55},
            {x: 6, y: 65},
        ],
    },
];

export const areaGradientData: ChartData = {
    series: {data: series},
    yAxis: [{title: {text: 'Value'}}],
    xAxis: {title: {text: 'X'}},
};
