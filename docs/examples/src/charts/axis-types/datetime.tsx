import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Temperature °C',
                data: [
                    {x: new Date('2024-01-01').getTime(), y: -3},
                    {x: new Date('2024-02-01').getTime(), y: -1},
                    {x: new Date('2024-03-01').getTime(), y: 4},
                    {x: new Date('2024-04-01').getTime(), y: 11},
                    {x: new Date('2024-05-01').getTime(), y: 17},
                    {x: new Date('2024-06-01').getTime(), y: 21},
                    {x: new Date('2024-07-01').getTime(), y: 23},
                    {x: new Date('2024-08-01').getTime(), y: 22},
                    {x: new Date('2024-09-01').getTime(), y: 16},
                    {x: new Date('2024-10-01').getTime(), y: 9},
                    {x: new Date('2024-11-01').getTime(), y: 3},
                    {x: new Date('2024-12-01').getTime(), y: -1},
                ],
            },
        ],
    },
    xAxis: {
        type: 'datetime',
    },
};

export function DatetimeAxisExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
