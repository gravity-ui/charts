import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'x-range',
                name: 'Project schedule',
                data: [
                    {x0: 0, x1: 3, y: 0, label: 'Design'},
                    {x0: 2, x1: 7, y: 1, label: 'Build'},
                    {x0: 6, x1: 9, y: 2, label: 'Review'},
                ],
            },
        ],
    },
    xAxis: {
        min: 0,
        max: 10,
        title: {text: 'Day'},
    },
    yAxis: [
        {
            type: 'category',
            categories: ['Design', 'Build', 'Review'],
        },
    ],
};

export default function XRangeExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
