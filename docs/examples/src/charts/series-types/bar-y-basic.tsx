import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Orders',
                data: [
                    {x: 84, y: 0},
                    {x: 65, y: 1},
                    {x: 42, y: 2},
                    {x: 28, y: 3},
                ],
            },
        ],
    },
    xAxis: {
        min: 0,
        title: {text: 'Orders'},
    },
    yAxis: [
        {
            type: 'category',
            categories: ['Home and garden', 'Electronics', 'Clothing', 'Books'],
        },
    ],
};

export default function BarYBasicExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Basic bar chart',
    description: 'Basic horizontal bar configuration with categories on the Y axis.',
    docsUrl: 'pages/guides/series-types/bar-y.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
