import type {ChartData} from '../../../types';

export const lineExplicitTickValuesData: ChartData = {
    legend: {enabled: false},
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                data: [
                    {x: 0, y: 0},
                    {x: 2, y: 30},
                    {x: 4, y: 40},
                    {x: 7, y: 80},
                    {x: 10, y: 100},
                ],
            },
        ],
    },
    xAxis: {
        min: 0,
        max: 10,
        ticks: {values: [0, 4, 10]},
    },
    yAxis: [
        {
            min: 0,
            max: 100,
            ticks: {values: [0, 40, 100]},
        },
    ],
};
