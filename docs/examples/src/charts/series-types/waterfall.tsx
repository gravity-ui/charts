import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Customers',
                dataLabels: {enabled: true},
                data: [
                    {x: 0, y: 120},
                    {x: 1, y: 45},
                    {x: 2, y: -20},
                    {x: 3, total: true},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Opening', 'New', 'Churned', 'Closing'],
    },
    yAxis: [
        {
            title: {text: 'Customers'},
        },
    ],
};

export function WaterfallExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
