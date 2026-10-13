import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        options: {
            line: {
                marker: {enabled: true, radius: 3},
                states: {
                    hover: {
                        marker: {radius: 8, borderColor: '#ffffff', borderWidth: 2},
                    },
                },
            },
        },
        data: [
            {
                type: 'line',
                name: 'Revenue',
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

export function LineMarkersExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
