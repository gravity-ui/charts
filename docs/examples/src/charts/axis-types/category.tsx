import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Sales',
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 78},
                    {x: 2, y: 55},
                    {x: 3, y: 91},
                    {x: 4, y: 63},
                    {x: 5, y: 84},
                    {x: 6, y: 37},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
};

export function CategoryAxisExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
