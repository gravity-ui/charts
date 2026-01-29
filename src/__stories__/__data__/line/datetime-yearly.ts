import type {ChartData} from '../../../types';

export const lineDatetimeYearlyData: ChartData = {
    series: {
        data: [
            {
                name: 'Profit',
                type: 'line',
                color: '#4DA2F1',
                data: [
                    {
                        y: 48702,
                        x: 1388534400000, // 2014-01-01
                    },
                    {
                        y: 60715,
                        x: 1420070400000, // 2015-01-01
                    },
                    {
                        y: 80660,
                        x: 1451606400000, // 2016-01-01
                    },
                    {
                        y: 91993,
                        x: 1483228800000, // 2017-01-01
                    },
                ],
                yAxis: 0,
            },
        ],
    },
    xAxis: {
        type: 'datetime',
        grid: {
            enabled: true,
        },
        ticks: {
            pixelInterval: 200,
        },
    },
    yAxis: [
        {
            type: 'linear',
            grid: {
                enabled: true,
            },
            ticks: {
                pixelInterval: 72,
            },
        },
    ],
};
