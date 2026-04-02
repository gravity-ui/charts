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
                    {x: 0, y: 120},
                    {x: 10, y: 135},
                    {x: 20, y: 128},
                    {x: 30, y: 155},
                    {x: 40, y: 162},
                    {x: 50, y: 178},
                    {x: 60, y: 171},
                    {x: 70, y: 195},
                ],
            },
        ],
    },
    xAxis: {
        type: 'linear',
    },
};

export function LinearAxisExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
