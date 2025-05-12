import {action} from '@storybook/addon-actions';

import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            options: {
                line: {
                    lineWidth: 2,
                },
            },
            data: [
                {
                    name: 'A',
                    type: 'area',
                    data: [
                        {x: 1, y: 200},
                        {x: 2, y: 220},
                        {x: 3, y: 180},
                    ],
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        format: {
                            type: 'number',
                            precision: 2,
                        },
                    },
                },
                {
                    name: 'B',
                    type: 'area',
                    data: [
                        {x: 1, y: 30},
                        {x: 2, y: 25},
                        {x: 3, y: 45},
                    ],
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                    },
                },
            ],
        },
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
}

export const areaPlaygroundData = prepareData();
