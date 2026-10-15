import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Orders',
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
    yAxis: [
        {
            title: {text: 'Orders'},
        },
    ],
};

export default function LineBasicExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Basic line chart',
    description: 'Basic line configuration with a categorical X axis.',
    docsUrl: 'pages/guides/series-types/line.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
