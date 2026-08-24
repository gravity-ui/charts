import type {ChartData} from '../../../types';

const DATA_POINTS = [
    {x: 0, y: 10},
    {x: 1, y: 60},
    {x: 2, y: 20},
    {x: 3, y: 80},
    {x: 4, y: 30},
    {x: 5, y: 70},
    {x: 6, y: 40},
];

export const lineInterpolationData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Linear (default)',
                data: DATA_POINTS,
                lineWidth: 2,
            },
            {
                type: 'line',
                name: 'Monotone',
                data: DATA_POINTS,
                lineWidth: 2,
                interpolation: {type: 'monotone'},
            },
            {
                type: 'line',
                name: 'Cardinal (tension 0.5)',
                data: DATA_POINTS,
                lineWidth: 2,
                interpolation: {type: 'cardinal', tension: 0.5},
            },
        ],
    },
    xAxis: {
        type: 'linear',
        title: {text: 'X'},
    },
    yAxis: [{title: {text: 'Y'}}],
    title: {text: 'Line interpolation types'},
};
