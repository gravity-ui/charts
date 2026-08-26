import type {ChartData, LineSeries} from '../../../types';

const series: LineSeries[] = [
    {
        type: 'line',
        name: 'Gradient line (left→right)',
        color: {
            type: 'linear-gradient',
            angle: 90,
            stops: [
                {offset: 0, color: '#ffe5d9'},
                {offset: 0.5, color: '#ffcad4'},
                {offset: 1, color: '#f4acb7'},
            ],
        },
        lineWidth: 2,
        marker: {
            enabled: true,
        },
        data: [
            {x: 0, y: 10},
            {x: 1, y: 30},
            {x: 2, y: 20},
            {x: 3, y: 50},
            {x: 4, y: 40},
            {x: 5, y: 70},
            {x: 6, y: 60},
        ],
    },
    {
        type: 'line',
        name: 'Gradient line (top→bottom)',
        color: {
            type: 'linear-gradient',
            angle: 180,
            stops: [
                {offset: 0, color: '#9b5de5'},
                {offset: 1, color: '#f15bb5'},
            ],
        },
        lineWidth: 2,
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

export const lineGradientData: ChartData = {
    series: {data: series},
    yAxis: [{title: {text: 'Value'}}],
    xAxis: {title: {text: 'X'}},
};
