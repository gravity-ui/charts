import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {
        enabled: false,
    },
    series: {
        data: [
            {
                type: 'line',
                name: 'Sales',
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 78},
                    {x: 2, y: 55},
                    {x: 3, y: 91},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        labels: {
            style: {
                fontSize: '16px',
            },
        },
    },
    yAxis: [
        {
            labels: {
                style: {
                    fontSize: '18px',
                },
            },
        },
    ],
};

export function AxisLabelFontSizeExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
