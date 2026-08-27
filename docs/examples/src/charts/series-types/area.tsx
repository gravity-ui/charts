import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Revenue',
                color: '#5b8def',
                fillColor: {
                    type: 'linear-gradient',
                    angle: 180,
                    stops: [
                        {offset: 0, color: '#5b8def'},
                        {offset: 1, color: '#dce8ff'},
                    ],
                },
                lineWidth: 2,
                opacity: 0.85,
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 58},
                    {x: 2, y: 51},
                    {x: 3, y: 73},
                    {x: 4, y: 68},
                    {x: 5, y: 84},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: [{title: {text: 'Revenue'}}],
};

export function AreaSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
