import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Deliveries',
                data: [
                    {x: 2, y: 12},
                    {x: 4, y: 18},
                    {x: 5, y: 15},
                    {x: 7, y: 24},
                    {x: 9, y: 22},
                    {x: 11, y: 35},
                    {x: 13, y: 31},
                    {x: 15, y: 42},
                ],
            },
        ],
    },
    xAxis: {
        title: {text: 'Distance, km'},
    },
    yAxis: [
        {
            title: {text: 'Delivery time, min'},
        },
    ],
};

export default function ScatterBasicExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
