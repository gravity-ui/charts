import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series 1',
                data: [
                    {x: 1, y: 2},
                    {x: 2, y: 8},
                    {x: 3, y: 35},
                    {x: 4, y: 180},
                    {x: 5, y: 1200},
                    {x: 6, y: 9500},
                ],
            },
        ],
    },
    yAxis: [
        {
            type: 'logarithmic',
        },
    ],
};

export function LogarithmicAxisExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
