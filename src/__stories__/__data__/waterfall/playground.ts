import {action} from '@storybook/addon-actions';

import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'waterfall',
                    data: [
                        {y: 100, x: 0},
                        {y: -20, x: 1},
                        {y: -15, x: 2},
                        {y: 30, x: 3},
                        {y: 45, x: 4},
                        {y: 10, x: 5},
                        {y: -120, x: 6},
                        {y: 30, x: 7},
                        {y: 10, x: 8},
                        {y: -20, x: 9},
                        {y: -5, x: 10},
                        {y: 35, x: 11},
                        {total: true, x: 12},
                    ],
                    name: 'Profit',
                    dataLabels: {enabled: true, numberFormat: {precision: 2}},
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
                'Totals',
            ],
            labels: {
                enabled: true,
                rotation: 30,
            },
        },
        yAxis: [
            {
                labels: {
                    enabled: true,
                    rotation: -90,
                },
                ticks: {
                    pixelInterval: 120,
                },
            },
        ],
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
}

export const waterfallPlaygroundData = prepareData();
